import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { activatePaidOrder } from "@/lib/payments";

export const dynamic = "force-dynamic";

// POST /api/verify-payment
// { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Called by the browser right after Razorpay Checkout succeeds.
// (The webhook at /api/payments/webhook activates the plan too, in case the browser closes.)
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

    const result = await activatePaidOrder({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      expectedUserId: session.userId,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, plan: result.plan, expiresAt: result.expiresAt });
  } catch (error) {
    console.error("VERIFY_PAYMENT_ERROR:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
