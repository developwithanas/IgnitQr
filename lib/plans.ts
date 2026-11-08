// Single source of truth for plan prices and coupons.
// Prices are decided here on the server — never trust a price sent by the browser.

export type PaidPlanName = "Professional" | "Enterprise";
export type PlanName = "Starter" | PaidPlanName;

export const PLAN_DURATION_DAYS = 30;

/**
 * What each plan actually allows — enforced on the server.
 * null = unlimited. Change numbers here and the whole app follows.
 */
export const PLAN_LIMITS: Record<PlanName, { locations: number | null; monthlyFeedback: number | null; aiReviews: boolean }> = {
  Starter: { locations: 1, monthlyFeedback: 50, aiReviews: false },
  Professional: { locations: 3, monthlyFeedback: null, aiReviews: true },
  Enterprise: { locations: null, monthlyFeedback: null, aiReviews: true },
};

// Only list features that really exist in the app.
export const PLANS: Record<PlanName, { label: string; priceInr: number; features: string[] }> = {
  Starter: {
    label: "Starter",
    priceInr: 0,
    features: ["1 Business Location", "50 Customer Feedbacks / mo", "Standard Review Suggestions", "Basic Analytics", "Email Support"],
  },
  Professional: {
    label: "Professional",
    priceInr: 999,
    features: ["Up to 3 Business Locations", "Unlimited Customer Feedback", "AI Review Engine", "Advanced Dashboard & CSV Export", "Priority Support"],
  },
  Enterprise: {
    label: "Enterprise",
    priceInr: 1999,
    features: ["Unlimited Business Locations", "Unlimited Customer Feedback", "AI Review Engine", "Advanced Dashboard & CSV Export", "Dedicated Account Manager"],
  },
};

type Coupon = { percentOff?: number; fixedPriceInr?: number; testModeOnly?: boolean };

const COUPONS: Record<string, Coupon> = {
  IGNITE50: { percentOff: 50 },
  WELCOME10: { percentOff: 10 },
  // ₹1 coupon for end-to-end testing. Only works while Razorpay is in test mode.
  TEST1: { fixedPriceInr: 1, testModeOnly: true },
};

export function isPaidPlan(plan: unknown): plan is PaidPlanName {
  return plan === "Professional" || plan === "Enterprise";
}

export function isRazorpayTestMode(): boolean {
  return (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_");
}

export type PriceQuote = {
  plan: PaidPlanName;
  basePriceInr: number;
  finalPriceInr: number;
  coupon: string | null;
  discountLabel: string | null;
};

/** Returns the price for a plan + optional coupon, or an error message. */
export function quotePrice(plan: unknown, rawCoupon?: unknown): PriceQuote | { error: string } {
  if (!isPaidPlan(plan)) return { error: "Invalid plan" };

  const basePriceInr = PLANS[plan].priceInr;
  const code = typeof rawCoupon === "string" ? rawCoupon.trim().toUpperCase() : "";

  if (!code) {
    return { plan, basePriceInr, finalPriceInr: basePriceInr, coupon: null, discountLabel: null };
  }

  const coupon = COUPONS[code];
  if (!coupon || (coupon.testModeOnly && !isRazorpayTestMode())) {
    return { error: "Invalid coupon code" };
  }

  if (coupon.fixedPriceInr !== undefined) {
    return {
      plan,
      basePriceInr,
      finalPriceInr: coupon.fixedPriceInr,
      coupon: code,
      discountLabel: `Test price ₹${coupon.fixedPriceInr}`,
    };
  }

  const percent = coupon.percentOff ?? 0;
  return {
    plan,
    basePriceInr,
    finalPriceInr: Math.max(1, Math.floor(basePriceInr * (1 - percent / 100))),
    coupon: code,
    discountLabel: `${percent}% off`,
  };
}

/** The plan a user actually has right now (paid plans fall back to Starter once expired). */
export function getEffectivePlan(user: { plan?: string | null; planExpiresAt?: Date | null } | null): {
  plan: PlanName;
  expiresAt: Date | null;
} {
  if (!user || !isPaidPlan(user.plan)) return { plan: "Starter", expiresAt: null };
  if (user.planExpiresAt && user.planExpiresAt.getTime() < Date.now()) {
    return { plan: "Starter", expiresAt: null };
  }
  return { plan: user.plan, expiresAt: user.planExpiresAt ?? null };
}

/** New expiry date when a payment succeeds: extends an active plan, otherwise starts from today. */
export function nextExpiry(currentExpiry: Date | null | undefined): Date {
  const start = currentExpiry && currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
  return new Date(start.getTime() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

/** Whole days left until a plan expires (null when there's no expiry). */
export function planDaysLeft(expiresAt: Date | null): number | null {
  return expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null;
}
