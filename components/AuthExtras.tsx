"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PLANS, isPaidPlan } from "@/lib/plans";
import RupeeIcon from "./RupeeIcon";

/** The plan the visitor picked before being asked to sign in (from ?redirect=/dashboard?checkout=...). */
function useCheckoutPlan(): string | null {
  const redirect = useSearchParams().get("redirect") || "";
  const query = redirect.includes("?") ? redirect.slice(redirect.indexOf("?") + 1) : "";
  const plan = new URLSearchParams(query).get("checkout");
  return isPaidPlan(plan) ? plan : null;
}

/** "You're getting Professional — ₹999/mo" banner on sign-in / sign-up. Use inside <Suspense>. */
export function CheckoutNotice({ mode }: { mode: "sign-in" | "sign-up" }) {
  const plan = useCheckoutPlan();
  if (!plan || !isPaidPlan(plan)) return null;
  return (
    <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
      <span className="w-9 h-9 rounded-lg bg-amber-500 text-black flex items-center justify-center shrink-0">
        <RupeeIcon className="w-5 h-5" />
      </span>
      <p className="text-sm text-amber-200">
        You&apos;re getting <span className="font-black text-white">{plan}</span> — ₹{PLANS[plan].priceInr}/mo.{" "}
        {mode === "sign-up" ? "Create your account" : "Sign in"} and we&apos;ll take you straight to payment.
      </p>
    </div>
  );
}

/** Link between sign-in and sign-up that keeps the ?redirect= (so the chosen plan isn't lost). Use inside <Suspense>. */
export function AuthSwitchLink({ to, children, email }: { to: "/sign-in" | "/sign-up"; children: React.ReactNode; email?: string }) {
  const redirect = useSearchParams().get("redirect");
  const params = new URLSearchParams();
  if (redirect) params.set("redirect", redirect);
  if (email) params.set("email", email);
  const qs = params.toString();
  return (
    <Link href={`${to}${qs ? `?${qs}` : ""}`} className="text-blue-400 hover:text-blue-300 font-semibold transition">
      {children}
    </Link>
  );
}
