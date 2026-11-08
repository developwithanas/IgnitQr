import { prisma } from "@/lib/prisma";
import { nextExpiry } from "@/lib/plans";

export type ActivationResult =
  | { ok: true; plan: string; expiresAt: Date | null; alreadyPaid: boolean; userId: string }
  | { ok: false; reason: "not_found" | "amount_mismatch" | "wrong_user" };

/**
 * Marks a Razorpay order as paid and activates the plan. Safe to call more
 * than once (browser verify + webhook both call it) — the second call is a no-op.
 */
export async function activatePaidOrder(params: {
  orderId: string;
  paymentId: string;
  amountPaise?: number; // checked when provided (webhook)
  expectedUserId?: string; // checked when provided (browser verify)
}): Promise<ActivationResult> {
  const payment = await prisma.payment.findUnique({
    where: { orderId: params.orderId },
    include: { user: { select: { id: true, plan: true, planExpiresAt: true } } },
  });
  if (!payment) return { ok: false, reason: "not_found" };
  if (params.expectedUserId && payment.userId !== params.expectedUserId) return { ok: false, reason: "wrong_user" };
  if (params.amountPaise !== undefined && params.amountPaise !== payment.amount) {
    console.error(`Amount mismatch for order ${params.orderId}: got ${params.amountPaise}, expected ${payment.amount}`);
    return { ok: false, reason: "amount_mismatch" };
  }

  if (payment.status === "paid") {
    return { ok: true, plan: payment.plan, expiresAt: payment.user.planExpiresAt, alreadyPaid: true, userId: payment.userId };
  }

  const expiresAt = nextExpiry(payment.user.plan === payment.plan ? payment.user.planExpiresAt : null);

  // Only flip "created"/"failed" -> "paid" once, even if two requests race.
  const updated = await prisma.payment.updateMany({
    where: { id: payment.id, status: { not: "paid" } },
    data: { status: "paid", paymentId: params.paymentId },
  });
  if (updated.count === 0) {
    return { ok: true, plan: payment.plan, expiresAt: payment.user.planExpiresAt, alreadyPaid: true, userId: payment.userId };
  }

  await prisma.user.update({
    where: { id: payment.userId },
    data: { plan: payment.plan, planExpiresAt: expiresAt },
  });

  return { ok: true, plan: payment.plan, expiresAt, alreadyPaid: false, userId: payment.userId };
}
