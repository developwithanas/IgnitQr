"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell, { authButtonClass, authInputClass, authLabelClass } from "@/components/AuthShell";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          This reset link is incomplete. Please request a new one.
        </div>
        <Link href="/forgot-password" className={authButtonClass}>Request New Link</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirm) return setError("Passwords don't match");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not reset password");
      router.push("/sign-in?reason=reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm space-y-2">
          <p>{error}</p>
          {error.includes("expired") && (
            <Link href="/forgot-password" className="underline font-bold">Request a new link</Link>
          )}
        </div>
      )}
      <div>
        <label className={authLabelClass}>New Password</label>
        <input
          type={show ? "text" : "password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className={authInputClass}
        />
      </div>
      <div>
        <label className={authLabelClass}>Confirm New Password</label>
        <input
          type={show ? "text" : "password"}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type it again"
          className={authInputClass}
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        Show password
      </label>
      <button type="submit" disabled={loading} className={`${authButtonClass} mt-2`}>
        {loading ? "Saving..." : "Set New Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Set New Password" subtitle="Choose a new password for your IgniteQR account">
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
