export const dynamic = "force-dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import UserDropdown from "@/components/UserDropdown";
import ActivityTracker from "@/components/ActivityTracker";
import { isEmailVerificationRequired } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan, planDaysLeft } from "@/lib/plans";
import CheckoutLauncher from "@/components/CheckoutLauncher";
import RupeeIcon from "@/components/RupeeIcon";
import { getOwnerUsage } from "@/lib/usage";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, reason } = await getAuthState();
  if (!session) {
    redirect(`/api/auth/logout?reason=${reason === "blocked" ? "blocked" : "expired"}`);
  }
  if (isEmailVerificationRequired() && !session.emailVerified) {
    redirect("/verify-email");
  }

  const planUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { plan: true, planExpiresAt: true },
  });
  const { plan, expiresAt } = getEffectivePlan(planUser);
  const daysLeft = planDaysLeft(expiresAt);
  const usage = await getOwnerUsage(session.userId);
  const feedbackLimit = usage.limits.monthlyFeedback;
  const showUsageBanner = feedbackLimit !== null && usage.feedbackThisMonth >= Math.floor(feedbackLimit * 0.8);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-300">
      <ActivityTracker />
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-x-hidden flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-[#111111] sticky top-0 z-[50]">
          <div className="flex items-center gap-4">
            <MobileNav />
            <div className="text-zinc-400 text-[10px] font-black uppercase tracking-widest hidden md:block">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            {plan === "Starter" ? (
              <Link
                href="/dashboard?checkout=Professional"
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition"
              >
                <RupeeIcon className="w-3.5 h-3.5" />
                Upgrade
              </Link>
            ) : (
              <Link
                href={daysLeft !== null && daysLeft <= 3 ? `/dashboard?checkout=${plan}` : "/dashboard/settings"}
                title={expiresAt ? `Valid until ${expiresAt.toLocaleDateString("en-IN")}` : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition ${
                  daysLeft !== null && daysLeft <= 3
                    ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                <RupeeIcon className="w-3.5 h-3.5" />
                {daysLeft !== null && daysLeft <= 3 ? `${plan} · Renew (${daysLeft}d left)` : plan}
              </Link>
            )}
            <div className="text-zinc-300 text-sm font-black hidden sm:block">
              Welcome, <span className="text-white">{session?.name || session?.email?.split("@")[0] || "User"}</span>!
            </div>
            <UserDropdown user={{ name: session.name, email: session.email, isStaff: session.isStaff }} />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 flex-1">
          <Suspense fallback={null}>
            <CheckoutLauncher />
          </Suspense>
          {showUsageBanner && feedbackLimit !== null && (
            <div
              className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 ${
                usage.acceptingFeedback ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex-1 text-sm">
                <p className="font-black text-white">
                  {usage.acceptingFeedback
                    ? `You've used ${usage.feedbackThisMonth} of ${feedbackLimit} free feedbacks this month`
                    : `Free limit reached: ${feedbackLimit}/${feedbackLimit} feedbacks this month`}
                </p>
                <p className="text-zinc-400">
                  {usage.acceptingFeedback
                    ? "Upgrade to keep collecting unlimited feedback and get AI review suggestions."
                    : "New customers are now sent straight to Google without leaving feedback here. Upgrade to collect unlimited feedback."}
                </p>
              </div>
              <Link
                href="/dashboard?checkout=Professional"
                className="shrink-0 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
              >
                <RupeeIcon className="w-3.5 h-3.5" />
                Upgrade — ₹999/mo
              </Link>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
