import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextExpiry } from "@/lib/plans";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

// POST /api/verify-payment
// { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Verifies the Razorpay signature, then activates the plan for the logged-in user.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment details" }, { status: 400 });
    }

    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ success: false, error: "Payment signature is invalid" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { orderId: razorpay_order_id } });
    if (!payment || payment.userId !== session.userId) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Already processed (e.g. user refreshed) — just report success.
    if (payment.status === "paid") {
      return NextResponse.json({ success: true, plan: payment.plan });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Extend the expiry only when renewing the same plan; switching plans starts fresh.
    const expiresAt = nextExpiry(user.plan === payment.plan ? user.planExpiresAt : null);

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "paid", paymentId: razorpay_payment_id },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { plan: payment.plan, planExpiresAt: expiresAt },
      }),
    ]);

    return NextResponse.json({ success: true, plan: payment.plan, expiresAt });
  } catch (error) {
    console.error("VERIFY_PAYMENT_ERROR:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
