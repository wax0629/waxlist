import { NextResponse } from "next/server";
import { registerWithPassword } from "@/lib/auth/user-store";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(40).optional(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const user = await registerWithPassword({
      email: body.email,
      password: body.password,
      name: body.name,
    });
    return NextResponse.json(
      {
        user,
        message: "注册成功",
      },
      { status: 201 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "注册失败";
    const status =
      msg.includes("已注册") ? 409 : msg.includes("格式") ? 400 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
