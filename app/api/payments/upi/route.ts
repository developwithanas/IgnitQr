import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quotePrice } from "@/lib/plans";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// POST /api/payments/upi  { plan, coupon?, reference }
// Records a manual UPI payment (QR Pay) for review. The plan is NOT activated
// automatically — the owner confirms the UTR in their bank app first.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 });
  }

  if (!(await checkRateLimit(req, "upi", 5, "1 h"))) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  try {
    const { plan, coupon, reference } = await req.json();
    const quote = quotePrice(plan, coupon);
    if ("error" in quote) {
      return NextResponse.json({ error: quote.error }, { status: 400 });
    }

    const utr = typeof reference === "string" ? reference.trim() : "";
    if (!/^[A-Za-z0-9]{8,30}$/.test(utr)) {
      return NextResponse.json(
        { error: "Please enter the UPI transaction ID (UTR) shown in your payment app" },
        { status: 400 }
      );
    }

    const duplicate = await prisma.payment.findFirst({ where: { reference: utr } });
    if (duplicate) {
      return NextResponse.json({ error: "This transaction ID has already been submitted" }, { status: 400 });
    }

    await prisma.payment.create({
      data: {
        userId: session.userId,
        plan: quote.plan,
        amount: quote.finalPriceInr * 100,
        coupon: quote.coupon,
        method: "upi",
        status: "pending_review",
        reference: utr,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPI_PAYMENT_ERROR:", error);
    return NextResponse.json({ error: "Could not submit payment. Please try again." }, { status: 500 });
  }
}
