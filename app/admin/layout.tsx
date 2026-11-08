export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import ActivityTracker from "@/components/ActivityTracker";
import { isEmailVerificationRequired } from "@/lib/email-verification";

export const metadata = { title: "Admin Panel - IgniteQR" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, reason } = await getAuthState();
  if (!session) redirect(`/api/auth/logout?reason=${reason === "blocked" ? "blocked" : "expired"}`);
  // Hide the admin panel completely from normal users.
  if (!session.isStaff) notFound();
  if (isEmailVerificationRequired() && !session.emailVerified) redirect("/verify-email?redirect=/admin");

  const pendingPayments = await prisma.payment.count({ where: { status: "pending_review" } });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300">
      <ActivityTracker />
      <header className="border-b border-zinc-800 bg-[#111111] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          <div className="flex items-center justify-between md:justify-start gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-black text-sm">A</span>
              <span className="text-white font-black tracking-tight">
                Ignite<span className="text-amber-500">QR</span> <span className="text-zinc-500 font-bold text-sm">Admin</span>
              </span>
            </Link>
            <Link href="/dashboard" className="md:hidden text-xs font-bold text-zinc-400 hover:text-white">
              ← Dashboard
            </Link>
          </div>
          <AdminNav pendingPayments={pendingPayments} />
          <div className="hidden md:flex items-center gap-4 ml-auto text-xs">
            <span className="text-zinc-500">
              {session.email} · <span className={session.isAdmin ? "text-amber-400" : "text-blue-400"}>{session.isAdmin ? "Super Admin" : "Staff"}</span>
            </span>
            <Link href="/dashboard" className="font-bold text-zinc-400 hover:text-white">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8">{children}</main>
    </div>
  );
}
