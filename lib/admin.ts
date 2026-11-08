import { NextResponse } from "next/server";
import { getSession, type Session } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** "Online now" = seen in the last 2 minutes. */
export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

/** Calendar day in India time, e.g. "2026-11-09". */
export function istDay(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isOnline(lastSeenAt: Date | null | undefined): boolean {
  return !!lastSeenAt && Date.now() - lastSeenAt.getTime() < ONLINE_WINDOW_MS;
}

/** 4500 -> "1h 15m" */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return seconds > 0 ? "<1m" : "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** "Online now", "5m ago", "3h ago", "2d ago", "Never" */
export function timeAgo(date: Date | null | undefined): string {
  if (!date) return "Never";
  const diff = Date.now() - date.getTime();
  if (diff < ONLINE_WINDOW_MS) return "Online now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatInr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

/**
 * For admin API routes. Returns the session, or a ready-made error response.
 * level "staff" = admin panel access; level "admin" = full control.
 */
export async function requireAdminApi(
  level: "staff" | "admin"
): Promise<{ session: Session; error: null } | { session: null; error: NextResponse }> {
  const session = await getSession();
  const allowed = level === "admin" ? session?.isAdmin : session?.isStaff;
  if (!session || !allowed) {
    return { session: null, error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }
  return { session, error: null };
}

/** Writes an entry to the audit log. Never throws. */
export async function logAdminAction(
  admin: Session,
  action: string,
  target?: { id: string; email: string } | null,
  details?: string
): Promise<void> {
  try {
    await prisma.adminLog.create({
      data: {
        adminId: admin.userId,
        adminEmail: admin.email,
        action,
        targetUserId: target?.id,
        targetEmail: target?.email,
        details: details?.slice(0, 500),
      },
    });
  } catch (error) {
    console.error("logAdminAction error:", error);
  }
}

/** Like timeAgo, but for events (signups, logins, reviews): "Just now" instead of "Online now". */
export function ago(date: Date | null | undefined): string {
  if (date && Date.now() - date.getTime() < ONLINE_WINDOW_MS) return "Just now";
  return timeAgo(date);
}
