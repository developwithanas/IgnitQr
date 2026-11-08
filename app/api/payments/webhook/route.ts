import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activatePaidOrder } from "@/lib/payments";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/webhook — Razorpay calls this when a payment succeeds or fails.
 * Activates the plan even if the customer closed the browser after paying.
 *
 * Setup (Razorpay Dashboard → Settings → Webhooks → Add):
 *   URL:    https://<your-site>/api/payments/webhook
 *   Secret: same value as RAZORPAY_WEBHOOK_SECRET in your environment
 *   Events: payment.captured, order.paid, payment.failed
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set — ignoring webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // Signature is computed over the exact raw body.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody);
    const paymentEntity = event?.payload?.payment?.entity;
    const orderId: string | undefined = paymentEntity?.order_id || event?.payload?.order?.entity?.id;
    const paymentId: string | undefined = paymentEntity?.id;

    if (!orderId || !paymentId) {
      return NextResponse.json({ ok: true, ignored: "no order/payment id" });
    }

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const result = await activatePaidOrder({
        orderId,
        paymentId,
        amountPaise: typeof paymentEntity?.amount === "number" ? paymentEntity.amount : undefined,
      });
      if (!result.ok) {
        console.error(`Webhook ${event.event} for ${orderId} not applied: ${result.reason}`);
      }
      // Always 200 so Razorpay doesn't keep retrying events we can't use.
      return NextResponse.json({ ok: true });
    }

    if (event.event === "payment.failed") {
      await prisma.payment.updateMany({
        where: { orderId, status: "created" },
        data: { status: "failed", paymentId },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, ignored: event.event });
  } catch (error) {
    console.error("RAZORPAY_WEBHOOK_ERROR:", error);
    // 500 makes Razorpay retry later (e.g. if the database was briefly down).
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
