import crypto from "crypto";
import { NextResponse } from "next/server";
import { getBaseUrl, safeRedirectPath } from "@/lib/site-url";
import { GOOGLE_STATE_COOKIE, getGoogleConfig, googleRedirectUri } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

// GET /api/auth/google?redirect=/dashboard — starts "Continue with Google".
export async function GET(req: Request) {
  const base = getBaseUrl(req);
  const config = getGoogleConfig();
  if (!config) {
    return NextResponse.redirect(`${base}/sign-in?reason=google_unavailable`);
  }

  const redirect = safeRedirectPath(new URL(req.url).searchParams.get("redirect"));
  const state = crypto.randomBytes(24).toString("base64url");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", googleRedirectUri(base));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set({
    name: GOOGLE_STATE_COOKIE,
    value: JSON.stringify({ state, redirect }),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
