import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Only same-site paths are allowed as redirect targets. */
function safePath(path: string | null): string | null {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
}

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("insightqr_token")?.value;
  const { pathname, search } = request.nextUrl;

  // Protect /dashboard and /admin — keep the full path + query (e.g. ?checkout=Professional)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!token) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Already logged in: skip /sign-in and /sign-up, and continue to where they were headed
  if ((pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) && token) {
    const target = safePath(request.nextUrl.searchParams.get("redirect")) || "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
