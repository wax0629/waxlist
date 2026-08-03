import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/auth/roles";
import { createRelease, listReleases } from "@/lib/releases/store";
import type { ReleaseSource, ReleaseStatus } from "@/lib/releases/types";
import { z } from "zod";

export const runtime = "nodejs";

/** Public: list published. Staff can pass status=pending|all */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const source = url.searchParams.get("source") as ReleaseSource | null;
  const session = await auth();
  const role = session?.user?.role;

  let status: ReleaseStatus | ReleaseStatus[] | undefined = "published";
  if (statusParam === "all" || statusParam === "pending") {
    if (!canModerate(role)) {
      return NextResponse.json({ error: "需要管理权限" }, { status: 403 });
    }
    status =
      statusParam === "all"
        ? ["draft", "pending", "published", "rejected"]
        : "pending";
  }

  const items = listReleases({
    status,
    source: source || undefined,
  });
  return NextResponse.json({ items });
}

const CreateBody = z.object({
  title: z.string().min(1),
  artists: z.array(z.string()).min(1),
  type: z.enum(["single", "ep", "album", "other"]).optional(),
  netease_id: z.string().optional(),
  netease_url: z.string().url().optional(),
  cover_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  curatorial_note: z.string().optional(),
  source: z.enum(["owner", "community"]),
  status: z.enum(["draft", "pending", "published", "rejected"]).optional(),
  sort_order: z.number().optional(),
});

/** Create release — owner/admin for owner source; logged-in user for community pending */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const body = CreateBody.parse(await req.json());
    const role = session.user.role;

    if (body.source === "owner" && role !== "owner") {
      return NextResponse.json({ error: "仅站主可写爱听" }, { status: 403 });
    }

    let status = body.status;
    if (body.source === "owner") {
      status = status ?? "published";
    } else if (!canModerate(role)) {
      status = "pending";
    } else {
      status = status ?? "published";
    }

    const release = createRelease({
      ...body,
      created_by: session.user.id,
      status,
    });
    return NextResponse.json({ release }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "创建失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
