import crypto from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "insightqr_token";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.CLERK_SECRET_KEY ||
  "insightqr-default-secure-secret-key-32bytes!";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  name?: string | null;
  tv?: number; // token version — must match User.tokenVersion
  exp?: number;
}

export type UserRole = "user" | "staff" | "admin";

export interface Session extends JWTPayload {
  role: UserRole;
  isAdmin: boolean; // full control
  isStaff: boolean; // admin panel access (admin or staff)
  emailVerified: boolean;
}

/** Sets the login cookie on a response. */
export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

// Emails that are always Super Admin (comma-separated in SUPER_ADMIN_EMAILS).
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || "developwithanas@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return !!email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

export function resolveRole(email: string, role: string | null | undefined, emailVerified = true): UserRole {
  // Super Admin by email only counts once that email is proven to belong to them.
  if ((isSuperAdminEmail(email) && emailVerified) || role === "admin") return "admin";
  if (role === "staff") return "staff";
  return "user";
}

/** True if the user is currently blocked (temporary blocks expire on their own). */
export function isBlocked(user: { status: string; blockedUntil: Date | null }): boolean {
  if (user.status !== "blocked") return false;
  return !user.blockedUntil || user.blockedUntil.getTime() > Date.now();
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) {
    s += "=";
  }
  return Buffer.from(s, "base64").toString("utf-8");
}

export function signToken(payload: Omit<JWTPayload, "exp">): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
  const fullPayload: JWTPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (signature.length !== expectedSignature.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export type AuthState =
  | { session: Session; reason: null }
  | { session: null; reason: "none" | "invalid" | "blocked" };

/**
 * Reads the login cookie and checks the user against the database, so blocked
 * users and force-logged-out sessions stop working immediately.
 * Cached per request, so calling it several times costs one DB query.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return { session: null, reason: "none" };

    const payload = verifyToken(token);
    if (!payload?.userId) return { session: null, reason: "invalid" };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        email: true,
        name: true,
        role: true,
        status: true,
        blockedUntil: true,
        tokenVersion: true,
        emailVerifiedAt: true,
      },
    });
    if (!user) return { session: null, reason: "invalid" };
    if (isBlocked(user)) return { session: null, reason: "blocked" };
    if ((payload.tv ?? 0) !== user.tokenVersion) return { session: null, reason: "invalid" };

    const role = resolveRole(user.email, user.role, !!user.emailVerifiedAt);
    return {
      session: {
        ...payload,
        email: user.email,
        name: user.name,
        role,
        isAdmin: role === "admin",
        isStaff: role === "admin" || role === "staff",
        emailVerified: !!user.emailVerifiedAt,
      },
      reason: null,
    };
  } catch (error) {
    console.error("getAuthState error:", error);
    return { session: null, reason: "invalid" };
  }
});

export async function getSession(): Promise<Session | null> {
  return (await getAuthState()).session;
}

/** Simple device label from a User-Agent string, e.g. "Mobile · Chrome · Android". */
export function describeDevice(userAgent: string | null | undefined): string {
  const ua = userAgent || "";
  const type = /mobile|android|iphone/i.test(ua) ? "Mobile" : /ipad|tablet/i.test(ua) ? "Tablet" : "Desktop";
  const browser = /edg\//i.test(ua) ? "Edge" : /opr\//i.test(ua) ? "Opera" : /chrome\//i.test(ua) ? "Chrome"
    : /firefox\//i.test(ua) ? "Firefox" : /safari\//i.test(ua) ? "Safari" : "Other";
  const os = /android/i.test(ua) ? "Android" : /iphone|ipad|ios/i.test(ua) ? "iOS" : /windows/i.test(ua) ? "Windows"
    : /mac os/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "Other";
  return `${type} · ${browser} · ${os}`;
}

/** Records a successful login (history + counters). Never throws. */
export async function recordLogin(userId: string, req: Request): Promise<void> {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent");
    await prisma.$transaction([
      prisma.loginEvent.create({
        data: { userId, ip, userAgent: userAgent?.slice(0, 300), device: describeDevice(userAgent) },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date(), loginCount: { increment: 1 }, lastSeenAt: new Date() },
      }),
    ]);
  } catch (error) {
    console.error("recordLogin error:", error);
  }
}

