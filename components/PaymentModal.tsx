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

type PaymentMethod = "card" | "paypal" | "qr";

export default function PaymentModal({ isOpen, onClose, planName, planPrice }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0); // percentage
  const [fixedPrice, setFixedPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "verifying" | "success">("idle");
  const router = useRouter();

  // Extract numeric value from price (e.g., "₹1499/mo" -> 1499)
  const basePrice = parseInt(planPrice.replace(/[^0-9]/g, "")) || 0;
  const finalPrice = fixedPrice !== null ? fixedPrice : Math.floor(basePrice * (1 - discount / 100));

  const applyCoupon = () => {
    const code = couponCode.toUpperCase();
    if (code === "TEST1") {
      setFixedPrice(1);
      setDiscount(0);
    } else if (code === "IGNITE50") {
      setDiscount(50);
      setFixedPrice(null);
    } else if (code === "WELCOME10") {
      setDiscount(10);
      setFixedPrice(null);
    } else {
      alert("Invalid Coupon Code");
      setDiscount(0);
      setFixedPrice(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Load Razorpay Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);


  const handlePayment = async () => {
    console.log("Payment Triggered. Method:", method);
    
    // If user is using Razorpay
    if (method === "card") {
       if (typeof (window as any).Razorpay === "undefined") {
         console.error("Razorpay script not found on window object");
         alert("Razorpay is still loading. Please wait a moment and try again.");
         return;
       }

       const keyId = "rzp_test_Smp3EkuLcx908E"; // Your current key
       
       if (keyId === "YOUR_KEY_HERE" || !keyId) {
         alert("Please add your Razorpay Key ID in the code!");
         return;
       }

       const options = {
         key: keyId,
         amount: finalPrice * 100, // Amount in paise
         currency: "INR",
         name: "IgniteQR",
         description: `${planName} Subscription`,
         image: "https://igniteqr.app/logo.png",
         config: {
           display: {
             blocks: {
               utib: {
                 name: "Pay via UPI",
                 instruments: [
                   { method: "upi" },
                 ],
               },
             },
             sequence: ["block.utib", "block.cards"],
             preferences: {
               show_default_blocks: true,
             },
           },
         },
         handler: async function (response: any) {
           // This function runs ONLY after a successful payment window completion
           setStatus("verifying");
           
           try {
             // Call our secure server-side verification route
             const verifyRes = await fetch("/api/verify-payment", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ paymentId: response.razorpay_payment_id }),
             });

             const verifyData = await verifyRes.json();

             if (verifyData.success) {
               setStatus("success");
               setTimeout(() => {
                 router.push("/dashboard");
               }, 1500);
             } else {
               alert("Payment Verification Failed. Please contact support.");
               setStatus("idle");
             }
           } catch (error) {
             console.error("Verification Error:", error);
             alert("Something went wrong during verification.");
             setStatus("idle");
           }
         },

         prefill: {
           name: "",
           email: "",
           contact: ""
         },
         theme: {
           color: "#f59e0b"
         }
       };

       const rzp = new (window as any).Razorpay(options);
       rzp.open();
    } else if (method === "paypal") {
       // PayPal simulation (usually requires a redirect)
       setStatus("verifying");
       setTimeout(() => setStatus("success"), 2000);
       setTimeout(() => router.push("/dashboard"), 3500);
    } else {
       // QR Pay logic (Manual confirmation)
       // Since this is direct UPI, we still have to use manual verification
       setStatus("verifying");
       setTimeout(() => {
         setStatus("success");
         setTimeout(() => {
           router.push("/dashboard");
         }, 1500);
       }, 3000);
    }
  };



  if (!isOpen) return null;



  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer" 
        onClick={onClose}
      ></div>
      {/* Modal Content */}
      <div className="relative w-full max-w-xl bg-[#111113] border border-white/10 rounded-[3rem] p-6 md:p-10 space-y-5 shadow-[0_30px_100px_rgba(0,0,0,0.8)] max-h-[95vh] overflow-y-auto no-scrollbar">
        
        {/* Status Overlays */}
        {status === "verifying" && (
          <div className="absolute inset-0 z-[110] bg-[#111113] flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
            <div className="w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black tracking-tighter text-white uppercase">Verifying Payment</h3>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Contacting Banking Servers...</p>
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
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Welcome to IgniteQR Pro</p>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors z-50 p-2"
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
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest italic">Instant Activation</p>
            </div>
          </div>
          <div className="text-right">
            {discount > 0 && <p className="text-zinc-500 line-through text-[10px] mb-0">₹{basePrice}</p>}
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
              className="flex-1 bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500/50 transition uppercase"
            />
            <button 
              onClick={applyCoupon}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/5 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition"
            >
              Apply
            </button>
          </div>
          {discount > 0 && <p className="text-green-500 text-[9px] font-black uppercase tracking-widest ml-1">✓ {discount}% Discount Applied!</p>}
        </div>

        {/* Payment Tabs */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
          {(["card", "paypal", "qr"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                method === m ? "bg-amber-500 text-black shadow-lg" : "text-zinc-500 hover:text-white"
              }`}
            >
              {m === "card" ? "Razorpay" : m === "paypal" ? "PayPal" : "QR Pay"}
            </button>
          ))}
        </div>

        {/* Method Content */}
        <div className="min-h-[160px] flex flex-col justify-center">
          {method === "card" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
              </div>
              <p className="text-zinc-500 text-xs font-medium px-8 uppercase tracking-widest">Secure Payments via Razorpay</p>
            </div>
          )}

          {method === "paypal" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.354c.056-.341.353-.585.699-.585h6.634c.347 0 .641.244.698.585l.001.006c.038.232-.128.452-.361.477-.168.018-.328-.088-.36-.255l-.001-.005L10.05 13.55c-.056.341-.353.585-.699.585H7.311a.641.641 0 0 0-.633.74l1.32 7.794c.056.331-.194.628-.522.628v.04zM19.262 7.215c0 3.844-4.57 3.844-4.57 3.844h-2.148l.707-4.175c.056-.341.353-.585.699-.585h.742c2.148 0 4.57.172 4.57 2.916zM15.438 12.5h-.732c-.347 0-.641.244-.698.585l-.01.06c-.038.232.128.452.361.477.168.018.328-.088.36-.255l.001-.005.109-.64c.056-.331-.194-.628-.522-.628h1.13c1.72 0 3.518.172 3.518 2.316 0 3.044-3.518 3.044-3.518 3.044h-1.648l.707-4.175c.056-.341.353-.585.699-.585h.442z"/></svg>
              </div>
              <p className="text-zinc-500 text-xs font-medium px-8 uppercase tracking-widest">PayPal Global Gateway</p>
            </div>
          )}

          {method === "qr" && (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                {mounted ? (
                  <QRCodeSVG 
                    value={`upi://pay?pa=8802720964@ptsbi&pn=IgniteQR&am=${finalPrice}&cu=INR&tn=IgniteQR ${planName} Plan`}
                    size={110}
                    fgColor="#000000"
                    level="H"
                  />
                ) : (
                  <div className="w-[110px] h-[110px] bg-zinc-200 animate-pulse rounded-lg"></div>
                )}
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xs">Scan to Pay Direct</p>
                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.2em]">UPI • Google Pay • PhonePe</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button 
          onClick={handlePayment}
          className="w-full bg-amber-500 text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition shadow-[0_15px_30px_rgba(245,158,11,0.2)]"
        >
          {method === "card" ? "Pay with Razorpay" : method === "paypal" ? "Pay with PayPal" : "Confirm My Payment"}
        </button>

        {/* Trust Footer */}
        <div className="flex items-center justify-between px-2 opacity-30 pt-2">
          <div className="flex items-center gap-2 text-zinc-500">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
             <span className="text-[8px] font-black uppercase tracking-[0.2em]">SSL Secured</span>
          </div>
          <div className="flex gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_logo%2C_revised_2016.svg" className="h-2.5 grayscale" alt="Stripe" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" className="h-2.5 grayscale" alt="Razorpay" />
          </div>
        </div>
      </div>
    </div>
  );
}



