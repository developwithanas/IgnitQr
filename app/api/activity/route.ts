import { NextResponse } from "next/server";
import { getAuthState } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { istDay } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Heartbeats arrive every ~60s while the dashboard is open and visible.
// A gap longer than this means the user left, so that gap is not counted.
const MAX_GAP_MS = 90 * 1000;

// POST /api/activity — heartbeat from the dashboard (counts time spent).
export async function POST() {
  const auth = await getAuthState();
  if (!auth.session) {
    return NextResponse.json({ status: auth.reason }, { status: 401 });
  }

  try {
    const userId = auth.session.userId;
    const now = new Date();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { lastSeenAt: true } });

    const gap = user?.lastSeenAt ? now.getTime() - user.lastSeenAt.getTime() : Infinity;
    // Ignore gaps under 20s too (several tabs open would otherwise double count).
    if (gap < 20 * 1000) return NextResponse.json({ ok: true });

    const seconds = gap <= MAX_GAP_MS ? Math.round(gap / 1000) : 0;
    const day = istDay(now);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: now, ...(seconds > 0 ? { activeSeconds: { increment: seconds } } : {}) },
      }),
      prisma.activityDay.upsert({
        where: { userId_day: { userId, day } },
        create: { userId, day, seconds },
        update: { seconds: { increment: seconds } },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ACTIVITY_ERROR:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
