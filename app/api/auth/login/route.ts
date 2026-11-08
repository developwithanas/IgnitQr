import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, isBlocked, recordLogin, setAuthCookie } from "@/lib/auth";
import { isEmailVerificationRequired } from "@/lib/email-verification";

export async function POST(req: Request) {
  if (!(await checkRateLimit(req, "login", 10, "10 m"))) {
    return NextResponse.json({ error: "Too many login attempts. Please try again in a few minutes." }, { status: 429 });
  }

  try {
    const { email, password } = await req.json();

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (!user) {
      return NextResponse.json(
        { code: "no_account", error: "No account exists with this email. Please create an account first." },
        { status: 404 }
      );
    }

    if (!verifyPassword(password, user.password)) {
      // Google-only accounts have no password; point them to the right button.
      if (!user.password && user.googleId) {
        return NextResponse.json(
          { code: "google_account", error: "This account uses Google sign-in. Click \"Continue with Google\" above." },
          { status: 401 }
        );
      }
      return NextResponse.json({ code: "wrong_password", error: "Incorrect password." }, { status: 401 });
    }

    if (isBlocked(user)) {
      const until = user.blockedUntil
        ? ` until ${user.blockedUntil.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
        : "";
      return NextResponse.json(
        {
          error: `Your account has been blocked${until}.${user.blockedReason ? ` Reason: ${user.blockedReason}.` : ""} Please contact support.`,
        },
        { status: 403 }
      );
    }

    await recordLogin(user.id, req);

    const response = NextResponse.json({
      success: true,
      needsVerification: isEmailVerificationRequired() && !user.emailVerifiedAt,
      user: { id: user.id, email: user.email, name: user.name },
    });
    setAuthCookie(response, signToken({ userId: user.id, email: user.email, name: user.name, tv: user.tokenVersion }));
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
