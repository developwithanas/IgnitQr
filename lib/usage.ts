import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, getEffectivePlan, type PlanName } from "@/lib/plans";

/** First moment of the current calendar month in India time. */
export function monthStartIST(now: Date = new Date()): Date {
  const ym = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).format(now);
  return new Date(`${ym}-01T00:00:00+05:30`);
}

export type OwnerUsage = {
  plan: PlanName;
  limits: (typeof PLAN_LIMITS)[PlanName];
  locations: number;
  feedbackThisMonth: number;
  canAddLocation: boolean;
  acceptingFeedback: boolean;
};

/** Current plan, limits and usage for a business owner. */
export async function getOwnerUsage(userId: string): Promise<OwnerUsage> {
  const [user, locations, feedbackThisMonth] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, planExpiresAt: true } }),
    prisma.business.count({ where: { userId } }),
    prisma.feedback.count({
      where: { createdAt: { gte: monthStartIST() }, qrCode: { business: { userId } } },
    }),
  ]);
  const { plan } = getEffectivePlan(user);
  const limits = PLAN_LIMITS[plan];
  return {
    plan,
    limits,
    locations,
    feedbackThisMonth,
    canAddLocation: limits.locations === null || locations < limits.locations,
    acceptingFeedback: limits.monthlyFeedback === null || feedbackThisMonth < limits.monthlyFeedback,
  };
}

export function locationLimitMessage(usage: OwnerUsage): string {
  return `Your ${usage.plan} plan allows ${usage.limits.locations} business location${usage.limits.locations === 1 ? "" : "s"}. Upgrade your plan to add more.`;
}
