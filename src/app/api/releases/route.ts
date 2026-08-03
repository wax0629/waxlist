import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/auth/roles";
import { parseNeteaseUrl } from "@/lib/netease/parse";
import { createRelease, listReleases } from "@/lib/releases/store";
import type { ReleaseSource, ReleaseStatus } from "@/lib/releases/types";
import { z } from "zod";

export const runtime = "nodejs";

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

  const items = await listReleases({
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
  netease_url: z.string().optional(),
  cover_url: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  curatorial_note: z.string().optional(),
  source: z.enum(["owner", "community"]),
  status: z.enum(["draft", "pending", "published", "rejected"]).optional(),
  sort_order: z.number().optional(),
});

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

    let netease_id = body.netease_id?.trim() || undefined;
    let netease_url = body.netease_url?.trim() || undefined;
    if (netease_url) {
      const parsed = parseNeteaseUrl(netease_url);
      if (parsed.id && !netease_id) netease_id = parsed.id;
      if (parsed.kind === "song" && !body.type) {
        body.type = "single";
      }
    }

    const release = await createRelease({
      title: body.title,
      artists: body.artists,
      type: body.type,
      netease_id,
      netease_url,
      cover_url: body.cover_url?.trim() || undefined,
      tags: body.tags,
      description: body.description,
      curatorial_note: body.curatorial_note,
      source: body.source,
      status,
      sort_order: body.sort_order,
      created_by: session.user.id,
      links: netease_url
        ? [{ label: "网易云", url: netease_url }]
        : [],
    });
    return NextResponse.json({ release }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "创建失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
