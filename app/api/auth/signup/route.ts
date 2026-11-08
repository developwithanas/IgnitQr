import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, recordLogin, setAuthCookie } from "@/lib/auth";
import { isEmailVerificationRequired, sendVerificationCode } from "@/lib/email-verification";

export async function POST(req: Request) {
  if (!(await checkRateLimit(req, "signup", 5, "1 h"))) {
    return NextResponse.json({ error: "Too many sign-up attempts. Please try again later." }, { status: 429 });
  }

  try {
    const { name, email, password } = await req.json();

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existingUser) {
      return NextResponse.json(
        { code: "account_exists", error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        name: typeof name === "string" && name.trim() ? name.trim().slice(0, 100) : null,
        password: hashPassword(password),
      },
    });

    const needsVerification = isEmailVerificationRequired();
    if (needsVerification) {
      const result = await sendVerificationCode(user);
      if (!result.ok) console.error(`Verification code not sent to ${user.email}:`, result.reason);
    }

    await recordLogin(user.id, req);

    const response = NextResponse.json({
      success: true,
      needsVerification,
      user: { id: user.id, email: user.email, name: user.name },
    });
    setAuthCookie(response, signToken({ userId: user.id, email: user.email, name: user.name, tv: user.tokenVersion }));
    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
