"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PLANS, isPaidPlan } from "@/lib/plans";
import { RupeeBadge } from "./RupeeIcon";

const PaymentModal = dynamic(() => import("./PaymentModal"), { ssr: false });

/**
 * Lives in the dashboard layout.
 *  - ?checkout=Professional&coupon=X → opens the payment popup (used after sign-in/sign-up)
 *  - ?upgraded=Professional           → shows a "plan is active" banner after paying
 */
export default function CheckoutLauncher() {
  const searchParams = useSearchParams();
  // Remount when the query changes so state starts fresh.
  return <Launcher key={searchParams.toString()} searchParams={searchParams} />;
}

function Launcher({ searchParams }: { searchParams: URLSearchParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const checkout = searchParams.get("checkout");
  const coupon = searchParams.get("coupon") || undefined;
  const upgraded = searchParams.get("upgraded");

  const [checkoutOpen, setCheckoutOpen] = useState(isPaidPlan(checkout));
  const [bannerOpen, setBannerOpen] = useState(isPaidPlan(upgraded));

  const clearQuery = () => router.replace(pathname, { scroll: false });

  return (
    <>
      {bannerOpen && isPaidPlan(upgraded) && (
        <div className="mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-green-500/10 border border-amber-500/30 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <RupeeBadge className="w-10 h-10" iconClassName="w-5 h-5" />
          <div className="flex-1">
            <p className="text-white font-black">🎉 {upgraded} plan is active!</p>
            <p className="text-sm text-zinc-400">Thank you for your payment. Your receipt has been sent by Razorpay. You can see your plan in Settings.</p>
          </div>
          <button
            onClick={() => {
              setBannerOpen(false);
              clearQuery();
            }}
            className="text-zinc-500 hover:text-white p-2"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {checkoutOpen && isPaidPlan(checkout) && (
        <PaymentModal
          isOpen
          planName={checkout}
          planPrice={`₹${PLANS[checkout].priceInr}/mo`}
          initialCoupon={coupon}
          onClose={() => {
            setCheckoutOpen(false);
            clearQuery();
          }}
        />
      )}
    </>
  );
}
