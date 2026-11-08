import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction, requireAdminApi, formatInr } from "@/lib/admin";
import { nextExpiry } from "@/lib/plans";

export const dynamic = "force-dynamic";

// POST /api/admin/payments/:id  { action: "approve" | "reject", note? }
// Staff and admins can review manual UPI payments.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session: admin, error } = await requireAdminApi("staff");
  if (error) return error;

  const { id } = await params;
  const { action, note } = await req.json().catch(() => ({}));

  const payment = await prisma.payment.findUnique({ where: { id }, include: { user: true } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "pending_review") {
    return NextResponse.json({ error: `Payment is already ${payment.status}` }, { status: 400 });
  }

  const who = { id: payment.userId, email: payment.user.email };
  const summary = `${payment.plan} ${formatInr(payment.amount)} UTR ${payment.reference ?? "-"}`;

  try {
    if (action === "approve") {
      const user = payment.user;
      const expiresAt = nextExpiry(user.plan === payment.plan ? user.planExpiresAt : null);
      await prisma.$transaction([
        prisma.payment.update({ where: { id }, data: { status: "paid" } }),
        prisma.user.update({ where: { id: user.id }, data: { plan: payment.plan, planExpiresAt: expiresAt } }),
      ]);
      await logAdminAction(admin, "approve_payment", who, summary);
    } else if (action === "reject") {
      await prisma.payment.update({ where: { id }, data: { status: "rejected" } });
      const reason = typeof note === "string" && note.trim() ? ` — ${note.trim().slice(0, 200)}` : "";
      await logAdminAction(admin, "reject_payment", who, summary + reason);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ADMIN_PAYMENT_ACTION_ERROR:", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
