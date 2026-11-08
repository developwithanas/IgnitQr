"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell, { authButtonClass, authInputClass, authLabelClass } from "@/components/AuthShell";
import GoogleButton from "@/components/GoogleButton";

type Result =
  | { kind: "sent"; googleOnly: boolean }
  | { kind: "no_account" }
  | { kind: "error"; message: string };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setResult({ kind: "sent", googleOnly: !!data.googleOnly });
      else if (data.code === "no_account") setResult({ kind: "no_account" });
      else setResult({ kind: "error", message: data.error || "Something went wrong" });
    } catch {
      setResult({ kind: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (result?.kind === "sent") {
    return (
      <AuthShell title="Check Your Email" subtitle="Your password reset link is on its way">
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            We sent a reset link to <span className="font-bold text-green-300">{email}</span>. It&apos;s valid for 30 minutes —
            check your spam folder too.
          </div>
          {result.googleOnly && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">This account was created with Google — you can also just sign in with Google:</p>
              <GoogleButton />
            </div>
          )}
          <Link href="/sign-in" className={authButtonClass}>Back to Sign In</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot Password" subtitle="We'll email you a link to set a new password">
      <form onSubmit={handleSubmit} className="space-y-4">
        {result?.kind === "no_account" && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm space-y-3">
            <p>
              No account exists with <span className="font-bold">{email}</span>. Please create an account first.
            </p>
            <Link
              href={`/sign-up?email=${encodeURIComponent(email)}`}
              className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-lg transition"
            >
              Create Account
            </Link>
          </div>
        )}
        {result?.kind === "error" && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{result.message}</div>
        )}
        <div>
          <label className={authLabelClass}>Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (result) setResult(null);
            }}
            placeholder="you@example.com"
            className={authInputClass}
          />
        </div>
        <button type="submit" disabled={loading} className={`${authButtonClass} mt-2`}>
          {loading ? "Checking..." : "Send Reset Link"}
        </button>
        <div className="text-center text-sm text-zinc-400 pt-2">
          Remembered it?{" "}
          <Link href="/sign-in" className="text-blue-400 hover:text-blue-300 font-semibold transition">Sign In</Link>
        </div>
      </form>
    </AuthShell>
  );
}
