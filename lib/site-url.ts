/**
 * Base URL for links we email or redirect to (reset links, Google callback).
 * Production uses NEXT_PUBLIC_SITE_URL so a forged Host header can't change it;
 * local testing on localhost uses the request's own origin.
 */
export function getBaseUrl(req: Request): string {
  const requestUrl = new URL(req.url);
  const isLocal = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
  const base = isLocal ? requestUrl.origin : process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
  return base.replace(/\/$/, "");
}

/** Only allow same-site relative paths as post-login redirects. */
export function safeRedirectPath(path: string | null | undefined, fallback = "/dashboard"): string {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}
