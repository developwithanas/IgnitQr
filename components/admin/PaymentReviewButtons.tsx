"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentReviewButtons({ paymentId, summary }: { paymentId: string; summary: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const act = async (action: "approve" | "reject") => {
    let note = "";
    if (action === "approve") {
      if (!confirm(`Approve ${summary}?\n\nOnly approve after you've seen this UTR in your bank/UPI app.`)) return;
    } else {
      const input = prompt(`Reject ${summary}?\n\nReason (optional):`);
      if (input === null) return;
      note = input;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Action failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={busy}
        onClick={() => act("approve")}
        className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
      >
        Approve
      </button>
      <button
        disabled={busy}
        onClick={() => act("reject")}
        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
      >
        Reject
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
