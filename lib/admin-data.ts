import { prisma } from "@/lib/prisma";

export type BusinessStats = { businesses: number; scans: number; reviews: number; posted: number };

/** Per-user totals of businesses, QR scans and reviews. */
export async function getBusinessStatsByUser(userIds?: string[]): Promise<Map<string, BusinessStats>> {
  const businesses = await prisma.business.findMany({
    where: userIds ? { userId: { in: userIds } } : undefined,
    select: {
      userId: true,
      qrCodes: {
        select: {
          scans: true,
          _count: { select: { feedbacks: true } },
          feedbacks: { where: { aiContent: "Posted" }, select: { id: true } },
        },
      },
    },
  });

  const map = new Map<string, BusinessStats>();
  for (const b of businesses) {
    const s = map.get(b.userId) ?? { businesses: 0, scans: 0, reviews: 0, posted: 0 };
    s.businesses += 1;
    for (const qr of b.qrCodes) {
      s.scans += qr.scans;
      s.reviews += qr._count.feedbacks;
      s.posted += qr.feedbacks.length;
    }
    map.set(b.userId, s);
  }
  return map;
}

/** Last N calendar days (IST) as YYYY-MM-DD, oldest first. */
export function lastNDays(n: number, today: string): string[] {
  const [y, m, d] = today.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  return Array.from({ length: n }, (_, i) =>
    new Date(base - (n - 1 - i) * 86400000).toISOString().slice(0, 10)
  );
}

export function shortDayLabel(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}
