"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import GoogleButton from "@/components/GoogleButton";
import { AuthSwitchLink, CheckoutNotice } from "@/components/AuthExtras";
import { useSearchParams } from "next/navigation";

/** Shows why the user was signed out (blocked account or expired session). */
function SignedOutNotice() {
  const reason = useSearchParams().get("reason");
  const notices: Record<string, { tone: string; text: string }> = {
    blocked: {
      tone: "bg-red-500/10 border-red-500/30 text-red-400",
      text: "Your account has been blocked. Please contact support if you think this is a mistake.",
    },
    expired: {
      tone: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      text: "Your session has ended. Please sign in again.",
    },
    reset: {
      tone: "bg-green-500/10 border-green-500/30 text-green-400",
      text: "Password updated! Sign in with your new password.",
    },
    google_cancelled: {
      tone: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      text: "Google sign-in was cancelled.",
    },
    google_failed: {
      tone: "bg-red-500/10 border-red-500/30 text-red-400",
      text: "Google sign-in didn't work. Please try again or use your email and password.",
    },
    google_unavailable: {
      tone: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      text: "Google sign-in isn't set up yet. Please use your email and password.",
    },
  };
  const notice = reason ? notices[reason] : undefined;
  if (!notice) return null;
  return <div className={`mb-5 p-3 rounded-lg border text-sm ${notice.tone}`}>{notice.text}</div>;
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorCode("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorCode(data.code || "");
        throw new Error(data.error || "Invalid credentials");
      }

      // Return to the page that sent the user here (only same-site paths).
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      const safeRedirect = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/dashboard";
      // New or unverified accounts confirm their email first (when verification is on).
      // Full page load (not push+refresh) so the new login cookie is used and the
      // ?checkout=… in the target URL is never lost.
      window.location.assign(data.needsVerification ? `/verify-email?redirect=${encodeURIComponent(safeRedirect)}` : safeRedirect);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[350px] h-[250px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-2 mb-8 z-10 group">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-105 transition">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-2xl font-black tracking-tight text-white">Ignite<span className="text-blue-500">QR</span></span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-zinc-950/80 border border-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl z-10 relative">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-white">Welcome Back</h1>
          <p className="text-zinc-400 text-sm mt-1">Sign in to your IgniteQR dashboard</p>
        </div>

        <Suspense fallback={null}>
          <CheckoutNotice mode="sign-in" />
        </Suspense>

        {!error && (
          <Suspense fallback={null}>
            <SignedOutNotice />
          </Suspense>
        )}

        {error && (
          <div
            className={`mb-5 p-3 rounded-lg border text-sm space-y-2 ${
              errorCode === "no_account"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            {errorCode === "no_account" && (
              <Suspense fallback={null}>
                <AuthSwitchLink to="/sign-up" email={email}>Create an account with this email →</AuthSwitchLink>
              </Suspense>
            )}
            {errorCode === "wrong_password" && (
              <Link href="/forgot-password" className="inline-block text-blue-400 hover:text-blue-300 font-semibold">
                Forgot your password? Reset it →
              </Link>
            )}
          </div>
        )}

        <GoogleButton label={"Continue with Google"} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Suspense fallback={<Link href="/sign-up" className="text-blue-400 font-semibold">Create an Account</Link>}>
            <AuthSwitchLink to="/sign-up">Create an Account</AuthSwitchLink>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

