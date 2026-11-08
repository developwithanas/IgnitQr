export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ONLINE_WINDOW_MS, formatDuration, formatInr, istDay, ago } from "@/lib/admin";
import { lastNDays, shortDayLabel } from "@/lib/admin-data";
import { Badge, BarList, Empty, OnlineDot, PlanBadge, Section, StatCard } from "@/components/admin/ui";

export default async function AdminOverviewPage() {
  const now = new Date();
  const today = istDay(now);
  const days7 = lastNDays(7, today);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthStart = new Date(`${today.slice(0, 8)}01T00:00:00+05:30`);

  const [
    totalUsers,
    onlineUsers,
    activeTodayCount,
    newThisWeek,
    paidUsers,
    blockedUsers,
    revenueMonth,
    revenueAll,
    pendingPayments,
    activity7,
    recentSignups,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      where: { lastSeenAt: { gte: new Date(now.getTime() - ONLINE_WINDOW_MS) } },
      select: { id: true, name: true, email: true, plan: true, lastSeenAt: true },
      orderBy: { lastSeenAt: "desc" },
    }),
    prisma.activityDay.count({ where: { day: today } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { plan: { not: "Starter" }, planExpiresAt: { gt: now } } }),
    prisma.user.count({ where: { status: "blocked" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "paid", method: { not: "admin_grant" }, createdAt: { gte: monthStart } },
    }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "paid", method: { not: "admin_grant" } } }),
    prisma.payment.count({ where: { status: "pending_review" } }),
    prisma.activityDay.groupBy({ by: ["day"], where: { day: { in: days7 } }, _sum: { seconds: true }, _count: true }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, createdAt: true, plan: true, lastSeenAt: true },
    }),
    prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const activityByDay = new Map(activity7.map((a) => [a.day, a]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Overview</h1>
        <p className="text-sm text-zinc-500">Everything happening on IgniteQR right now.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Users" value={totalUsers} hint={`+${newThisWeek} this week`} href="/admin/users" />
        <StatCard label="Online Now" value={onlineUsers.length} tone="green" href="/admin/users?filter=online" />
        <StatCard label="Active Today" value={activeTodayCount} tone="blue" href="/admin/users?filter=today" />
        <StatCard label="Paid Users" value={paidUsers} tone="amber" href="/admin/users?filter=paid" />
        <StatCard label="Revenue (This Month)" value={formatInr(revenueMonth._sum.amount ?? 0)} tone="green" hint={`All time ${formatInr(revenueAll._sum.amount ?? 0)}`} />
        <StatCard
          label="Pending UPI"
          value={pendingPayments}
          tone={pendingPayments > 0 ? "amber" : "default"}
          hint={pendingPayments > 0 ? "Needs your approval" : "All clear"}
          href="/admin/payments"
        />
        <StatCard label="Blocked" value={blockedUsers} tone={blockedUsers > 0 ? "red" : "default"} href="/admin/users?filter=blocked" />
        <StatCard label="Inactive 7+ days" value="View" hint="Users to follow up" href="/admin/users?filter=inactive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Section title={`Online Now (${onlineUsers.length})`}>
          {onlineUsers.length === 0 ? (
            <Empty>Nobody is online right now.</Empty>
          ) : (
            <ul>
              {onlineUsers.map((u) => (
                <li key={u.id} className="border-t border-zinc-800/70 first:border-t-0">
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-900/60 transition">
                    <OnlineDot online />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{u.name || u.email.split("@")[0]}</p>
                      <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                    </div>
                    <PlanBadge plan={u.plan} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Time Spent — Last 7 Days (All Users)">
          <BarList
            rows={days7.map((day) => {
              const a = activityByDay.get(day);
              const secs = a?._sum.seconds ?? 0;
              return {
                label: day === today ? "Today" : shortDayLabel(day),
                value: secs,
                display: `${formatDuration(secs)} · ${a?._count ?? 0}u`,
              };
            })}
          />
        </Section>

        <Section title="Recent Signups" action={<Link href="/admin/users" className="text-xs font-bold text-amber-500 hover:underline">All users →</Link>}>
          <ul>
            {recentSignups.map((u) => (
              <li key={u.id} className="border-t border-zinc-800/70 first:border-t-0">
                <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-900/60 transition">
                  <OnlineDot online={!!u.lastSeenAt && now.getTime() - u.lastSeenAt.getTime() < ONLINE_WINDOW_MS} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{u.name || u.email.split("@")[0]}</p>
                    <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <span className="text-xs text-zinc-500 hidden sm:block">joined {ago(u.createdAt)}</span>
                  <PlanBadge plan={u.plan} />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Recent Admin Actions" action={<Link href="/admin/logs" className="text-xs font-bold text-amber-500 hover:underline">Full log →</Link>}>
          {recentLogs.length === 0 ? (
            <Empty>No admin actions yet.</Empty>
          ) : (
            <ul>
              {recentLogs.map((log) => (
                <li key={log.id} className="border-t border-zinc-800/70 first:border-t-0 px-5 py-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={log.action.includes("block") && !log.action.includes("unblock") ? "red" : "default"}>
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-zinc-300 font-bold">{log.targetEmail ?? ""}</span>
                    <span className="text-zinc-600 ml-auto">{ago(log.createdAt)}</span>
                  </div>
                  {log.details && <p className="text-zinc-500 mt-1">{log.details}</p>}
                  <p className="text-zinc-600 mt-0.5">by {log.adminEmail}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
