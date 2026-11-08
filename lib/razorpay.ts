import crypto from "crypto";

export function getRazorpayCredentials(): { keyId: string; keySecret: string } | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret || !keyId.startsWith("rzp_")) return null;
  return { keyId, keySecret };
}

export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const creds = getRazorpayCredentials();
  if (!creds) throw new Error("Razorpay is not configured");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes,
    }),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description || `Razorpay order failed (${res.status})`);
  }
  return data;
}

/** Checks the signature Razorpay Checkout returns after a successful payment. */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const creds = getRazorpayCredentials();
  if (!creds) return false;

  const expected = crypto
    .createHmac("sha256", creds.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
