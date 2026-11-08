"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell, { authButtonClass, authInputClass } from "@/components/AuthShell";

function VerifyEmailForm() {
  const router = useRouter();
  const redirectParam = useSearchParams().get("redirect");
  const redirect = redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//") ? redirectParam : "/dashboard";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const sendCode = async () => {
    setError("");
    setInfo("");
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resend: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (typeof data.cooldown === "number") setCooldown(data.cooldown);
    if (!res.ok) setError(data.error || "Could not send the code");
    else setInfo("A new code has been sent. Check your inbox and spam folder.");
  };

  // Load status; send a first code automatically if none was sent recently.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/verify-email");
      if (res.status === 401) {
        router.replace("/sign-in");
        return;
      }
      const data = await res.json();
      if (cancelled) return;
      if (data.verified) {
        router.replace(redirect);
        return;
      }
      setEmail(data.email);
      setCooldown(data.cooldown);
      setLoading(false);
      if (data.cooldown === 0) await sendCode();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown for the "Resend" button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Verification failed");
      window.location.assign(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setBusy(false);
    }
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-up");
  };

  if (loading) return <p className="text-sm text-zinc-500">Loading...</p>;

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-sm text-zinc-400">
        We sent a 6-digit code to <span className="font-bold text-white">{email}</span>.
      </p>

      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
      {info && !error && <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">{info}</div>}

      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="••••••"
        className={`${authInputClass} text-center text-2xl tracking-[0.6em] font-black`}
        autoFocus
      />

      <button type="submit" disabled={busy || code.length !== 6} className={authButtonClass}>
        {busy ? "Verifying..." : "Verify Email"}
      </button>

      <div className="flex items-center justify-between text-sm pt-1">
        <button
          type="button"
          onClick={sendCode}
          disabled={cooldown > 0}
          className="text-blue-400 hover:text-blue-300 font-semibold disabled:text-zinc-600 disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
        <button type="button" onClick={signOut} className="text-zinc-500 hover:text-white">
          Wrong email?
        </button>
      </div>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Verify Your Email" subtitle="One quick step to secure your IgniteQR account">
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading...</p>}>
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  );
}
