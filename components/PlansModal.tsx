"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PLANS, type PlanName } from "@/lib/plans";

const PaymentModal = dynamic(() => import("./PaymentModal"), { ssr: false });

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

const PLAN_ORDER: PlanName[] = ["Starter", "Professional", "Enterprise"];

export default function PlansModal({ isOpen, onClose, currentPlan = "Starter" }: PlansModalProps) {
  const [checkoutPlan, setCheckoutPlan] = useState<PlanName | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-5xl bg-[#1a1b23] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
          <h2 className="text-white font-bold text-2xl tracking-tight">Select Your Plan</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLAN_ORDER.map((name) => {
            const plan = PLANS[name];
            const isCurrent = currentPlan === name;
            const isPaid = plan.priceInr > 0;

            return (
              <div key={name} className={`relative p-8 rounded-[2rem] border transition-all duration-500 group ${
                isCurrent
                  ? "bg-blue-600/10 border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.15)]"
                  : "bg-zinc-900/50 border-white/5 hover:border-white/20"
              }`}>
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-full shadow-lg">
                    Your Plan
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-zinc-400 font-black uppercase tracking-widest text-xs">{plan.label}</h3>
                    <div className="flex items-baseline gap-1 pt-2">
                      <span className="text-4xl font-black text-white tracking-tighter">{isPaid ? `₹${plan.priceInr}` : "Free"}</span>
                      {isPaid && <span className="text-zinc-500 font-bold">/mo</span>}
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                        <svg className={`w-4 h-4 ${isCurrent ? "text-blue-500" : "text-green-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={!isPaid}
                    onClick={() => isPaid && setCheckoutPlan(name)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-xl disabled:cursor-default ${
                      isCurrent
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20"
                        : "bg-zinc-800 text-white hover:bg-zinc-700 shadow-black/20 disabled:hover:bg-zinc-800"
                    }`}
                  >
                    {!isPaid ? (isCurrent ? "Current Plan" : "Free") : isCurrent ? "Renew Plan" : `Upgrade to ${plan.label}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest border-t border-white/5">
          Need a custom solution? <Link href="/#contact" className="text-blue-500 hover:underline">Contact our sales team</Link>
        </div>
      </div>

      {checkoutPlan && (
        <PaymentModal
          isOpen
          onClose={() => setCheckoutPlan(null)}
          planName={checkoutPlan}
          planPrice={`₹${PLANS[checkoutPlan].priceInr}/mo`}
        />
      )}
    </div>
  );
}
