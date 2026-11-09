import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getBaseUrl } from "@/lib/site-url";

function clearCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST() {
  return clearCookie(NextResponse.json({ success: true, message: "Logged out" }));
}

// GET /api/auth/logout?reason=blocked|expired
// Used when a session is no longer valid (blocked user, forced logout).
export async function GET(req: Request) {
  const reason = new URL(req.url).searchParams.get("reason");
  const target = new URL("/sign-in", getBaseUrl(req));
  if (reason === "blocked" || reason === "expired") target.searchParams.set("reason", reason);
  return clearCookie(NextResponse.redirect(target));
}
