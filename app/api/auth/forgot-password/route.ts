import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import { buildResetUrl, createResetToken, sendResetEmail } from "@/lib/password-reset";

export const dynamic = "force-dynamic";

// POST /api/auth/forgot-password  { email }
// Tells the user clearly if no account exists (rate-limited to limit email probing).
export async function POST(req: Request) {
  if (!(await checkRateLimit(req, "forgot-password", 10, "1 h"))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    const trimmed = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: trimmed },
      select: { id: true, email: true, name: true, password: true, googleId: true },
    });

    if (!user) {
      return NextResponse.json(
        { code: "no_account", error: "No account exists with this email. Please create an account first." },
        { status: 404 }
      );
    }

    // Google-only accounts can still set a password through the reset link,
    // but most people just want to use the Google button.
    const googleOnly = !user.password && !!user.googleId;

    const token = await createResetToken(user.id);
    const sent = await sendResetEmail(user.email, user.name, buildResetUrl(token, req));
    if (!sent) {
      console.error(`Password reset email could not be sent to ${user.email}`);
      return NextResponse.json(
        { code: "send_failed", error: "We couldn't send the email right now. Please contact support for a reset link." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, googleOnly });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
