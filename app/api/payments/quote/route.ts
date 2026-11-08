import { NextResponse } from "next/server";
import { quotePrice } from "@/lib/plans";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// POST /api/payments/quote  { plan, coupon? } -> server-calculated price
export async function POST(req: Request) {
  if (!(await checkRateLimit(req, "coupon", 20, "10 m"))) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  try {
    const { plan, coupon } = await req.json();
    const quote = quotePrice(plan, coupon);
    if ("error" in quote) {
      return NextResponse.json({ error: quote.error }, { status: 400 });
    }
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
