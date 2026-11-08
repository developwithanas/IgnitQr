import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quotePrice } from "@/lib/plans";
import { createRazorpayOrder, getRazorpayCredentials } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

// POST /api/payments/create-order  { plan, coupon? }
// Creates a Razorpay order for the logged-in user at a server-decided price.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 });
  }

  const creds = getRazorpayCredentials();
  if (!creds) {
    console.error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing or invalid in environment");
    return NextResponse.json(
      { error: "Online payments are not available right now. Please use QR Pay." },
      { status: 503 }
    );
  }

  try {
    const { plan, coupon } = await req.json();
    const quote = quotePrice(plan, coupon);
    if ("error" in quote) {
      return NextResponse.json({ error: quote.error }, { status: 400 });
    }

    const amountPaise = quote.finalPriceInr * 100;

    const payment = await prisma.payment.create({
      data: {
        userId: session.userId,
        plan: quote.plan,
        amount: amountPaise,
        coupon: quote.coupon,
        method: "razorpay",
        status: "created",
      },
    });

    const order = await createRazorpayOrder({
      amountPaise,
      receipt: payment.id,
      notes: { userId: session.userId, plan: quote.plan, paymentRecordId: payment.id },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { orderId: order.id },
    });

    return NextResponse.json({
      keyId: creds.keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: quote.plan,
      prefill: { name: session.name || "", email: session.email },
    });
  } catch (error) {
    console.error("CREATE_ORDER_ERROR:", error);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
