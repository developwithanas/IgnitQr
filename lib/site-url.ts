/**
 * Base URL for links we email or redirect to (reset links, Google callback).
 *
 * Behind Render's proxy, req.url points at the internal server
 * (http://localhost:10000), so the public host comes from the forwarded
 * headers. Production prefers NEXT_PUBLIC_SITE_URL so a forged Host header
 * can't change emailed links; local testing uses the request's own host.
 */
export function getBaseUrl(req: Request): string {
  const requestUrl = new URL(req.url);
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || requestUrl.host).split(",")[0].trim();
  const proto = (req.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "")).split(",")[0].trim();
  const publicOrigin = `${proto}://${host}`;

  const hostname = host.split(":")[0];
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocal) return publicOrigin.replace(/\/$/, "");

  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const base = configured && !configured.includes("your-app") ? configured : publicOrigin;
  return base.replace(/\/$/, "");
}

/** Only allow same-site relative paths as post-login redirects. */
export function safeRedirectPath(path: string | null | undefined, fallback = "/dashboard"): string {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}
