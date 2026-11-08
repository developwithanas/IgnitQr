"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60";
const labelClass = "block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5";

export default function CreateUserButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("Starter");
  const [days, setDays] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ userId: string; email: string; password?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPlan("Starter");
    setDays("30");
    setError("");
    setCreated(null);
    setCopied(false);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, plan: plan === "Starter" ? null : plan, days: Number(days) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create account");
      setCreated({ userId: data.userId, email: email.trim().toLowerCase(), password: data.password });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  const loginText = created
    ? `Your IgniteQR account is ready!\nLogin: ${typeof window !== "undefined" ? window.location.origin : ""}/sign-in\nEmail: ${created.email}${created.password ? `\nPassword: ${created.password}` : ""}\n(You can change the password anytime using "Forgot password".)`
    : "";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-white text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition flex items-center gap-2 shrink-0"
      >
        <span className="text-base leading-none">+</span> Create Account
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : close} />
          <div className="relative w-full max-w-md bg-[#111111] border border-zinc-800 rounded-2xl p-6 space-y-5 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">{created ? "Account Created ✓" : "Create Account"}</h2>
              <button onClick={close} className="text-zinc-500 hover:text-white p-1" aria-label="Close">✕</button>
            </div>

            {created ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-300 space-y-1">
                  <p><span className="text-zinc-400">Email:</span> <span className="font-bold text-white">{created.email}</span></p>
                  {created.password && (
                    <p>
                      <span className="text-zinc-400">Password:</span>{" "}
                      <span className="font-mono font-bold text-white">{created.password}</span>
                    </p>
                  )}
                </div>
                {created.password && (
                  <p className="text-xs text-amber-400">This password is shown only once. Copy it now and send it to the customer.</p>
                )}
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(loginText);
                      setCopied(true);
                    } catch {
                      setCopied(false);
                    }
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  {copied ? "Copied ✓ — paste in WhatsApp" : "Copy Login Details"}
                </button>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/users/${created.userId}`}
                    onClick={close}
                    className="flex-1 text-center bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    Open User
                  </Link>
                  <button onClick={reset} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest">
                    Create Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
                <div>
                  <label className={labelClass}>Name / Business Name</label>
                  <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sharma Sweets" />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" />
                </div>
                <div>
                  <label className={labelClass}>Password</label>
                  <input
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave empty to auto-generate a strong one"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Plan</label>
                    <select className={inputClass} value={plan} onChange={(e) => setPlan(e.target.value)}>
                      <option value="Starter">Starter (free)</option>
                      <option value="Professional">Professional (gift)</option>
                      <option value="Enterprise">Enterprise (gift)</option>
                    </select>
                  </div>
                  {plan !== "Starter" && (
                    <div>
                      <label className={labelClass}>For</label>
                      <select className={inputClass} value={days} onChange={(e) => setDays(e.target.value)}>
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                        <option value="365">1 year</option>
                      </select>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {busy ? "Creating..." : "Create Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
