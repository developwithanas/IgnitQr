"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: string;
}

type PaymentMethod = "razorpay" | "qr";
type Status = "idle" | "processing" | "verifying" | "success" | "submitted";

// UPI ID that receives QR Pay payments.
const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "8802720964@ptsbi";
const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    let script = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener("load", () => resolve(true), { once: true });
    script.addEventListener("error", () => resolve(false), { once: true });
  });
}

export default function PaymentModal({ isOpen, onClose, planName, planPrice }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("razorpay");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountLabel, setDiscountLabel] = useState<string | null>(null);
  const [quotedPrice, setQuotedPrice] = useState<number | null>(null);
  const [couponError, setCouponError] = useState("");
  const [upiReference, setUpiReference] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  // Display price only — the server always recalculates the real amount.
  const basePrice = parseInt(planPrice.replace(/[^0-9]/g, "")) || 0;
  const finalPrice = quotedPrice ?? basePrice;

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const goToSignIn = () => {
    router.push(`/sign-in?redirect=${encodeURIComponent("/#pricing")}`);
  };

  const applyCoupon = async () => {
    setCouponError("");
    const code = couponCode.trim();
    if (!code) return;

    try {
      const res = await fetch("/api/payments/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName, coupon: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAppliedCoupon(null);
        setDiscountLabel(null);
        setQuotedPrice(null);
        setCouponError(data.error || "Invalid coupon code");
        return;
      }
      setAppliedCoupon(data.coupon);
      setDiscountLabel(data.discountLabel);
      setQuotedPrice(data.finalPriceInr);
    } catch {
      setCouponError("Could not check coupon. Please try again.");
    }
  };

  const payWithRazorpay = async () => {
    setStatus("processing");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Could not load Razorpay. Check your internet connection and try again.");
      setStatus("idle");
      return;
    }

    const orderRes = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planName, coupon: appliedCoupon }),
    });
    const order = await orderRes.json();

    if (orderRes.status === 401) {
      goToSignIn();
      return;
    }
    if (!orderRes.ok) {
      setError(order.error || "Could not start payment. Please try again.");
      setStatus("idle");
      return;
    }

    const rzp = new (window as any).Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "IgniteQR",
      description: `${planName} Plan (30 days)`,
      prefill: order.prefill,
      theme: { color: "#f59e0b" },
      config: {
        display: {
          blocks: {
            upi: { name: "Pay via UPI", instruments: [{ method: "upi" }] },
          },
          sequence: ["block.upi"],
          preferences: { show_default_blocks: true },
        },
      },
      modal: {
        ondismiss: () => setStatus("idle"),
      },
      handler: async (response: any) => {
        setStatus("verifying");
        try {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.success) {
            setStatus("success");
            setTimeout(() => {
              router.push("/dashboard/settings");
              router.refresh();
            }, 1500);
          } else {
            setError(
              verifyData.error ||
                "We could not verify your payment. If money was deducted, please contact support."
            );
            setStatus("idle");
          }
        } catch {
          setError("Network error while verifying payment. If money was deducted, please contact support.");
          setStatus("idle");
        }
      },
    });

    rzp.on("payment.failed", (resp: any) => {
      setError(resp?.error?.description || "Payment failed. Please try again.");
      setStatus("idle");
    });

    rzp.open();
  };

  const submitUpiPayment = async () => {
    if (!upiReference.trim()) {
      setError("Please enter the UPI transaction ID (UTR) after paying.");
      return;
    }
    setStatus("processing");

    const res = await fetch("/api/payments/upi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planName, coupon: appliedCoupon, reference: upiReference }),
    });
    const data = await res.json();

    if (res.status === 401) {
      goToSignIn();
      return;
    }
    if (!res.ok) {
      setError(data.error || "Could not submit payment. Please try again.");
      setStatus("idle");
      return;
    }
    setStatus("submitted");
  };

  const handlePayment = async () => {
    setError("");
    try {
      if (method === "razorpay") {
        await payWithRazorpay();
      } else {
        await submitUpiPayment();
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  if (!isOpen) return null;

  const busy = status === "processing" || status === "verifying";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
        onClick={busy ? undefined : onClose}
      ></div>
      {/* Modal Content */}
      <div className="relative w-full max-w-xl bg-[#111113] border border-white/10 rounded-[3rem] p-6 md:p-10 space-y-5 shadow-[0_30px_100px_rgba(0,0,0,0.8)] max-h-[95vh] overflow-y-auto no-scrollbar">

        {/* Status Overlays */}
        {status === "verifying" && (
          <div className="absolute inset-0 z-[110] bg-[#111113] flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
            <div className="w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black tracking-tighter text-white uppercase">Verifying Payment</h3>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Please don&apos;t close this window...</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="absolute inset-0 z-[110] bg-[#111113] flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.3)]">
              <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black tracking-tighter text-white uppercase">Payment Received!</h3>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Your {planName} plan is now active</p>
            </div>
          </div>
        )}

        {status === "submitted" && (
          <div className="absolute inset-0 z-[110] bg-[#111113] flex flex-col items-center justify-center space-y-6 px-8 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.3)]">
              <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black tracking-tighter text-white uppercase">Payment Submitted</h3>
              <p className="text-zinc-400 text-xs font-medium">
                We&apos;ll confirm your UPI payment and activate your {planName} plan, usually within a few hours.
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
            >
              Close
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={busy}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors z-50 p-2 disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* Header */}
        <div className="space-y-1 text-center">
          <h2 className="text-amber-500 text-[9px] font-black uppercase tracking-[0.4em]">Secure Checkout</h2>
          <h3 className="text-2xl font-black tracking-tighter text-white">Upgrade to <span className="text-amber-500">{planName}</span></h3>
        </div>

        {/* Plan Summary */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <p className="text-white font-black text-xs">{planName} Subscription</p>
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest italic">30 days access</p>
            </div>
          </div>
          <div className="text-right">
            {finalPrice !== basePrice && <p className="text-zinc-500 line-through text-[10px] mb-0">₹{basePrice}</p>}
            <p className="text-white font-black text-xl">₹{finalPrice}</p>
          </div>
        </div>

        {/* Coupon Code */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Coupon Code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
              className="flex-1 bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500/50 transition uppercase"
            />
            <button
              onClick={applyCoupon}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/5 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition"
            >
              Apply
            </button>
          </div>
          {discountLabel && <p className="text-green-500 text-[9px] font-black uppercase tracking-widest ml-1">✓ {discountLabel} Applied!</p>}
          {couponError && <p className="text-red-400 text-[9px] font-black uppercase tracking-widest ml-1">{couponError}</p>}
        </div>

        {/* Payment Tabs */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
          {(["razorpay", "qr"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMethod(m); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${method === m ? "bg-amber-500 text-black shadow-lg" : "text-zinc-500 hover:text-white"
                }`}
            >
              {m === "razorpay" ? "Razorpay (Card / UPI)" : "QR Pay"}
            </button>
          ))}
        </div>

        {/* Method Content */}
        <div className="min-h-[160px] flex flex-col justify-center">
          {method === "razorpay" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <p className="text-zinc-500 text-xs font-medium px-8 uppercase tracking-widest">Cards, UPI, Netbanking &amp; Wallets — instant activation</p>
            </div>
          )}

          {method === "qr" && (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                <QRCodeSVG
                  value={`upi://pay?pa=${UPI_ID}&pn=IgniteQR&am=${finalPrice}&cu=INR&tn=${encodeURIComponent(`IgniteQR ${planName} Plan`)}`}
                  size={110}
                  fgColor="#000000"
                  level="H"
                />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xs">Scan &amp; pay ₹{finalPrice}</p>
                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.2em]">UPI • Google Pay • PhonePe • Paytm</p>
              </div>
              <input
                type="text"
                placeholder="UPI Transaction ID (UTR)"
                value={upiReference}
                onChange={(e) => setUpiReference(e.target.value.replace(/\s/g, ""))}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500/50 transition text-center"
              />
              <p className="text-zinc-600 text-[9px] text-center">After paying, enter the 12-digit UTR from your UPI app. Plan is activated once we confirm it.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handlePayment}
          disabled={busy}
          className="w-full bg-amber-500 text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition shadow-[0_15px_30px_rgba(245,158,11,0.2)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {status === "processing"
            ? "Please wait..."
            : method === "razorpay"
              ? `Pay ₹${finalPrice} with Razorpay`
              : "I've Paid — Submit UTR"}
        </button>

        {/* Trust Footer */}
        <div className="flex items-center justify-between px-2 opacity-30 pt-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">SSL Secured</span>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">Powered by Razorpay</span>
        </div>
      </div>
    </div>
  );
}
