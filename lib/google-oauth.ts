export const GOOGLE_STATE_COOKIE = "igniteqr_google_oauth";

export function getGoogleConfig(): { clientId: string; clientSecret: string } | null {
  // NEXT_PUBLIC_ values are baked in at build time; GOOGLE_CLIENT_ID is read at runtime.
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function googleRedirectUri(baseUrl: string): string {
  return `${baseUrl}/api/auth/google/callback`;
}

export type GoogleProfile = { sub: string; email: string; name: string | null };

/**
 * Exchanges the authorization code for tokens and reads the verified profile
 * from the ID token. The token comes straight from Google over TLS
 * (server-to-server), so per OpenID Connect we check the claims rather than the signature.
 */
export async function exchangeCodeForProfile(code: string, redirectUri: string): Promise<GoogleProfile> {
  const config = getGoogleConfig();
  if (!config) throw new Error("Google sign-in is not configured");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.id_token) {
    throw new Error(`Google token exchange failed: ${data.error_description || data.error || res.status}`);
  }

  const payloadPart = String(data.id_token).split(".")[1];
  const claims = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));

  const validIssuer = claims.iss === "accounts.google.com" || claims.iss === "https://accounts.google.com";
  if (!validIssuer || claims.aud !== config.clientId || !claims.sub || claims.exp * 1000 < Date.now()) {
    throw new Error("Google ID token failed validation");
  }
  if (!claims.email || claims.email_verified !== true) {
    throw new Error("Google account email is not verified");
  }

  return { sub: String(claims.sub), email: String(claims.email).toLowerCase(), name: claims.name ? String(claims.name) : null };
}
