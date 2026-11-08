"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  userLabel: string;
  userEmail: string;
  blocked: boolean;
  role: "user" | "staff" | "admin";
  emailVerified: boolean;
  canManage: boolean; // current viewer is Super Admin
  isProtected: boolean; // target is self or a Super Admin
};

const inputClass =
  "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60";
const btn = "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition disabled:opacity-50 disabled:cursor-not-allowed";

export default function UserActions({ userId, userLabel, userEmail, blocked, role, emailVerified, canManage, isProtected }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockDays, setBlockDays] = useState("0");
  const [grantPlan, setGrantPlan] = useState("Professional");
  const [grantDays, setGrantDays] = useState("30");
  const [resetUrl, setResetUrl] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const deleteAccount = async () => {
    if (!confirm(`Permanently delete ${userEmail}?

This removes their businesses, QR codes, reviews and payment records. Printed QR codes will stop working. This cannot be undone.`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: deleteConfirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete account");
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Could not delete account" });
      setBusy(false);
    }
  };
  const [copied, setCopied] = useState(false);

  const createResetLink = async () => {
    if (!confirm(`Create a password reset link for ${userLabel}?\n\nAnyone with this link can set a new password for 30 minutes — only share it with the account owner.`)) return;
    setBusy(true);
    setMessage(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_link" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.resetUrl) throw new Error(data.error || "Could not create link");
      setResetUrl(data.resetUrl);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Could not create link" });
    } finally {
      setBusy(false);
    }
  };

  const copyResetUrl = async () => {
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (!canManage) {
    return (
      <p className="px-5 py-4 text-sm text-zinc-500">
        Only the Super Admin can block users, change plans or roles.
      </p>
    );
  }

  const run = async (body: Record<string, unknown>, confirmText: string | null, okText: string) => {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Action failed");
      setMessage({ type: "ok", text: okText });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Action failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5 space-y-6">
      {message && (
        <div
          className={`p-3 rounded-xl text-sm border ${
            message.type === "ok"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Block / Unblock */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Access</p>
        {isProtected ? (
          <p className="text-sm text-zinc-500">This account can&apos;t be blocked.</p>
        ) : blocked ? (
          <button
            disabled={busy}
            onClick={() => run({ action: "unblock" }, `Unblock ${userLabel}?`, "User unblocked. They can log in again.")}
            className={`${btn} bg-green-600 hover:bg-green-500 text-white`}
          >
            Unblock User
          </button>
        ) : (
          <div className="space-y-2">
            <input className={inputClass} placeholder="Reason (shown to the user)" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
            <div className="flex gap-2">
              <select className={inputClass} value={blockDays} onChange={(e) => setBlockDays(e.target.value)}>
                <option value="0">Until I unblock</option>
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
              </select>
              <button
                disabled={busy}
                onClick={() =>
                  run(
                    { action: "block", reason: blockReason, days: Number(blockDays) },
                    `Block ${userLabel}? They will be logged out immediately.`,
                    "User blocked and logged out."
                  )
                }
                className={`${btn} bg-red-600 hover:bg-red-500 text-white shrink-0`}
              >
                Block
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grant plan */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Give Plan (Free)</p>
        <div className="flex gap-2">
          <select className={inputClass} value={grantPlan} onChange={(e) => setGrantPlan(e.target.value)}>
            <option value="Professional">Professional</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Starter">Starter (remove paid plan)</option>
          </select>
          {grantPlan !== "Starter" && (
            <select className={`${inputClass} w-32`} value={grantDays} onChange={(e) => setGrantDays(e.target.value)}>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          )}
        </div>
        <button
          disabled={busy}
          onClick={() =>
            run(
              { action: "grant_plan", plan: grantPlan, days: Number(grantDays) },
              grantPlan === "Starter"
                ? `Remove ${userLabel}'s paid plan?`
                : `Give ${userLabel} ${grantPlan} free for ${grantDays} days?`,
              grantPlan === "Starter" ? "Plan set to Starter." : `${grantPlan} activated for ${grantDays} days.`
            )
          }
          className={`${btn} bg-amber-500 hover:bg-amber-400 text-black`}
        >
          {grantPlan === "Starter" ? "Set to Starter" : "Give Plan"}
        </button>
      </div>

      {/* Role */}
      {!isProtected && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Role</p>
          <p className="text-xs text-zinc-500">Staff can open the admin panel and approve UPI payments, but can&apos;t block users or change plans.</p>
          {role === "staff" ? (
            <button
              disabled={busy}
              onClick={() => run({ action: "set_role", role: "user" }, `Remove staff access from ${userLabel}?`, "Staff access removed.")}
              className={`${btn} bg-zinc-800 hover:bg-zinc-700 text-white`}
            >
              Remove Staff Access
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => run({ action: "set_role", role: "staff" }, `Give ${userLabel} staff access to the admin panel?`, "User is now Staff.")}
              className={`${btn} bg-blue-600 hover:bg-blue-500 text-white`}
            >
              Make Staff
            </button>
          )}
        </div>
      )}

      {/* Email verification */}
      {!emailVerified && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</p>
          <p className="text-xs text-zinc-500">Not verified yet. Only mark it verified if you have confirmed this email belongs to them.</p>
          <button
            disabled={busy}
            onClick={() => run({ action: "mark_verified" }, `Mark ${userLabel}'s email as verified?`, "Email marked as verified.")}
            className={`${btn} bg-green-600 hover:bg-green-500 text-white`}
          >
            Mark Email Verified
          </button>
        </div>
      )}

      {/* Password reset link */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Password</p>
        <p className="text-xs text-zinc-500">User forgot their password? Create a reset link and send it to them (e.g. on WhatsApp).</p>
        {resetUrl ? (
          <div className="space-y-2">
            <input readOnly value={resetUrl} onFocus={(e) => e.target.select()} className={`${inputClass} font-mono text-xs`} />
            <div className="flex items-center gap-2">
              <button onClick={copyResetUrl} className={`${btn} bg-amber-500 hover:bg-amber-400 text-black`}>
                {copied ? "Copied ✓" : "Copy Link"}
              </button>
              <span className="text-[11px] text-zinc-500">Valid for 30 minutes, works once.</span>
            </div>
          </div>
        ) : (
          <button disabled={busy} onClick={createResetLink} className={`${btn} bg-zinc-800 hover:bg-zinc-700 text-white`}>
            Create Reset Link
          </button>
        )}
      </div>

      {/* Force logout */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sessions</p>
        <button
          disabled={busy}
          onClick={() =>
            run({ action: "force_logout" }, `Log ${userLabel} out of all devices?`, "User logged out of all devices.")
          }
          className={`${btn} bg-zinc-800 hover:bg-zinc-700 text-white`}
        >
          Log Out Everywhere
        </button>
      </div>
      {/* Danger zone */}
      {!isProtected && (
        <div className="space-y-2 pt-4 border-t border-red-500/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Danger Zone</p>
          <p className="text-xs text-zinc-500">
            Deletes the account with all businesses, QR codes, reviews and payment records. Printed QR codes stop working.
            To just stop access, use <span className="text-zinc-300">Block</span> instead.
          </p>
          <input
            className={inputClass}
            placeholder={`Type ${userEmail} to confirm`}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <button
            disabled={busy || deleteConfirm.trim().toLowerCase() !== userEmail.toLowerCase()}
            onClick={deleteAccount}
            className={`${btn} bg-red-600 hover:bg-red-500 text-white w-full`}
          >
            Delete Account Permanently
          </button>
        </div>
      )}
    </div>
  );
}
