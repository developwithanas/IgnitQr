import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { findValidResetToken } from "@/lib/password-reset";

export const dynamic = "force-dynamic";

// POST /api/auth/reset-password  { token, password }
export async function POST(req: Request) {
  if (!(await checkRateLimit(req, "reset-password", 10, "1 h"))) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  try {
    const { token, password } = await req.json();

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const record = await findValidResetToken(typeof token === "string" ? token : "");
    if (!record) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        // New password + sign out of every device that used the old one.
        data: { password: hashPassword(password), tokenVersion: { increment: 1 } },
      }),
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR:", error);
    return NextResponse.json({ error: "Could not reset password. Please try again." }, { status: 500 });
  }
}
