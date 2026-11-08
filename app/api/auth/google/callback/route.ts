import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isBlocked, recordLogin, setAuthCookie, signToken } from "@/lib/auth";
import { getBaseUrl, safeRedirectPath } from "@/lib/site-url";
import { GOOGLE_STATE_COOKIE, exchangeCodeForProfile, googleRedirectUri } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

// GET /api/auth/google/callback — Google sends the user back here.
export async function GET(req: Request) {
  const base = getBaseUrl(req);
  const url = new URL(req.url);
  const fail = (reason = "google_failed") => {
    const res = NextResponse.redirect(`${base}/sign-in?reason=${reason}`);
    res.cookies.delete(GOOGLE_STATE_COOKIE);
    return res;
  };

  // User pressed "Cancel" on Google's screen.
  if (url.searchParams.get("error")) return fail("google_cancelled");

  const cookieStore = await cookies();
  let saved: { state?: string; redirect?: string } = {};
  try {
    saved = JSON.parse(cookieStore.get(GOOGLE_STATE_COOKIE)?.value || "{}");
  } catch {
    saved = {};
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !saved.state || state !== saved.state) return fail();

  try {
    const profile = await exchangeCodeForProfile(code, googleRedirectUri(base));

    let user = await prisma.user.findFirst({ where: { googleId: profile.sub } });

    if (!user) {
      const existing = await prisma.user.findUnique({ where: { email: profile.email } });
      if (existing) {
        if (existing.googleId && existing.googleId !== profile.sub) return fail();
        user = await prisma.user.update({
          where: { id: existing.id },
          data: existing.emailVerifiedAt
            ? { googleId: profile.sub }
            : {
                // Nobody had proven they own this email yet, so whoever set the
                // old password may not be the real owner: remove it and sign out
                // other sessions. The owner can set a new one via "Forgot password".
                googleId: profile.sub,
                emailVerifiedAt: new Date(),
                password: "",
                tokenVersion: { increment: 1 },
              },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            password: "", // Google-only account
            googleId: profile.sub,
            emailVerifiedAt: new Date(),
          },
        });
      }
    } else if (!user.emailVerifiedAt) {
      user = await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    }

    if (isBlocked(user)) return fail("blocked");

    await recordLogin(user.id, req);
    const response = NextResponse.redirect(`${base}${safeRedirectPath(saved.redirect)}`);
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    setAuthCookie(response, signToken({ userId: user.id, email: user.email, name: user.name, tv: user.tokenVersion }));
    return response;
  } catch (error) {
    console.error("GOOGLE_CALLBACK_ERROR:", error);
    return fail();
  }
}
