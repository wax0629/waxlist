import { NextResponse } from "next/server";
import { parseIdentifier, type AuthChannel } from "@/lib/auth/identifiers";
import { requestOtp } from "@/lib/auth/otp";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  channel: z.enum(["email", "phone"]),
  target: z.string().min(3).max(254),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const channel = body.channel as AuthChannel;
    const { target } = parseIdentifier(channel, body.target);
    const result = await requestOtp({ channel, target });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "发送失败";
    const status = msg.includes("秒后再") ? 429 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
