import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import { getResendCooldown, sendVerificationCode, verifyCode } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

// GET  /api/auth/verify-email          -> { email, verified, cooldown }
// POST /api/auth/verify-email {code}   -> verify the 6-digit code
// POST /api/auth/verify-email {resend: true} -> send a new code
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  return NextResponse.json({
    email: session.email,
    verified: session.emailVerified,
    cooldown: session.emailVerified ? 0 : await getResendCooldown(session.userId),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (session.emailVerified) return NextResponse.json({ success: true, verified: true });

  if (!(await checkRateLimit(req, "verify-email", 20, "10 m"))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    if (body.resend) {
      const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true, name: true } });
      if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
      const result = await sendVerificationCode(user);
      if (!result.ok && result.reason === "cooldown") {
        return NextResponse.json({ error: `Please wait ${result.wait}s before requesting another code`, cooldown: result.wait }, { status: 429 });
      }
      if (!result.ok) {
        return NextResponse.json(
          { error: "We couldn't send the email right now. Please try again later or contact support." },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: true, sent: true, cooldown: await getResendCooldown(session.userId) });
    }

    const result = await verifyCode(session.userId, String(body.code ?? ""));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error("VERIFY_EMAIL_ERROR:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
