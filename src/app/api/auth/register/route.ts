import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth/user-store";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(40).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = Body.parse(json);
    const user = await createUser({
      email: body.email,
      password: body.password,
      name: body.name ?? body.email.split("@")[0] ?? "user",
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "注册失败";
    const status = msg.includes("已注册") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
