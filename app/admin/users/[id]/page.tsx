export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isBlocked, isSuperAdminEmail, resolveRole } from "@/lib/auth";
import { formatDate, formatDuration, formatInr, istDay, isOnline, timeAgo, ago } from "@/lib/admin";
import { lastNDays, shortDayLabel } from "@/lib/admin-data";
import { getEffectivePlan } from "@/lib/plans";
import { Badge, BarList, Empty, OnlineDot, PlanBadge, Section, StatCard, tableClass, tdClass, thClass } from "@/components/admin/ui";
import UserActions from "@/components/admin/UserActions";

const paymentTone = (status: string) =>
  status === "paid" ? "green" : status === "pending_review" ? "amber" : status === "rejected" || status === "failed" ? "red" : "default";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getSession();
  const today = istDay();
  const days14 = lastNDays(14, today);

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      loginEvents: { orderBy: { createdAt: "desc" }, take: 20 },
      activityDays: { where: { day: { in: days14 } } },
      payments: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!user) notFound();

  const [businesses, logs] = await Promise.all([
    prisma.business.findMany({
      where: { userId: user.id },
      orderBy: { id: "desc" },
      include: {
        qrCodes: {
          include: { feedbacks: { select: { rating: true, aiContent: true, createdAt: true } } },
        },
      },
    }),
    prisma.adminLog.findMany({ where: { targetUserId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const role = resolveRole(user.email, user.role, !!user.emailVerifiedAt);
  const blocked = isBlocked(user);
  const online = isOnline(user.lastSeenAt);
  const { plan, expiresAt } = getEffectivePlan(user);
  const daySeconds = new Map(user.activityDays.map((d) => [d.day, d.seconds]));
  const last7 = days14.slice(-7).reduce((sum, d) => sum + (daySeconds.get(d) ?? 0), 0);
  const label = user.name || user.email;

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-xs font-bold text-zinc-500 hover:text-white">← All users</Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-xl font-black flex items-center justify-center shrink-0">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black text-white tracking-tight truncate">{user.name || user.email.split("@")[0]}</h1>
          <p className="text-sm text-zinc-500 truncate">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            <OnlineDot online={online} /> {online ? "Online now" : `Last seen ${timeAgo(user.lastSeenAt).toLowerCase()}`}
          </span>
          {blocked ? <Badge tone="red">Blocked</Badge> : <Badge tone="green">Active</Badge>}
          {role === "admin" && <Badge tone="amber">Super Admin</Badge>}
          {role === "staff" && <Badge tone="blue">Staff</Badge>}
          {user.emailVerifiedAt ? <Badge tone="green">Email verified</Badge> : <Badge tone="amber">Email unverified</Badge>}
          {user.googleId && <Badge>Google login</Badge>}
          <PlanBadge plan={plan} />
        </div>
      </div>

      {blocked && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          Blocked {user.blockedUntil ? `until ${formatDate(user.blockedUntil)}` : "until manually unblocked"}
          {user.blockedReason ? ` — “${user.blockedReason}”` : ""}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Joined" value={user.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} hint={ago(user.createdAt)} />
        <StatCard label="Last Login" value={user.lastLoginAt ? ago(user.lastLoginAt) : "Never"} hint={formatDate(user.lastLoginAt)} />
        <StatCard label="Logins" value={user.loginCount} />
        <StatCard label="Today" value={formatDuration(daySeconds.get(today) ?? 0)} tone="blue" />
        <StatCard label="Last 7 Days" value={formatDuration(last7)} tone="blue" />
        <StatCard label="Total Time" value={formatDuration(user.activeSeconds)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Section title="Time Spent — Last 14 Days">
            <BarList
              rows={days14.map((day) => ({
                label: day === today ? "Today" : shortDayLabel(day),
                value: daySeconds.get(day) ?? 0,
                display: formatDuration(daySeconds.get(day) ?? 0),
              }))}
            />
          </Section>

          <Section title={`Businesses (${businesses.length})`}>
            {businesses.length === 0 ? (
              <Empty>Has not created a business yet — good person to follow up with.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>Business</th>
                      <th className={thClass}>Scans</th>
                      <th className={thClass}>Reviews</th>
                      <th className={thClass}>Avg Rating</th>
                      <th className={thClass}>Posted to Google</th>
                      <th className={thClass}>Last Review</th>
                      <th className={thClass}>QR Page</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((b) => {
                      const feedbacks = b.qrCodes.flatMap((q) => q.feedbacks);
                      const scans = b.qrCodes.reduce((s, q) => s + q.scans, 0);
                      const avg = feedbacks.length ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length : 0;
                      const posted = feedbacks.filter((f) => f.aiContent === "Posted").length;
                      const lastReview = feedbacks.reduce<Date | null>((latest, f) => (!latest || f.createdAt > latest ? f.createdAt : latest), null);
                      return (
                        <tr key={b.id}>
                          <td className={`${tdClass} font-bold text-white`}>{b.name}</td>
                          <td className={`${tdClass} text-zinc-300`}>{scans}</td>
                          <td className={`${tdClass} text-zinc-300`}>{feedbacks.length}</td>
                          <td className={`${tdClass} text-zinc-300`}>{avg ? `${avg.toFixed(1)} ★` : "—"}</td>
                          <td className={`${tdClass} text-zinc-300`}>{posted}</td>
                          <td className={`${tdClass} text-zinc-500`}>{lastReview ? ago(lastReview) : "—"}</td>
                          <td className={tdClass}>
                            {b.qrCodes[0] ? (
                              <a href={`/feedback/${b.qrCodes[0].id}`} target="_blank" className="text-xs font-bold text-amber-500 hover:underline">
                                Open ↗
                              </a>
                            ) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Login History (last 20)">
            {user.loginEvents.length === 0 ? (
              <Empty>No logins recorded yet. (Tracking started with this update.)</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>When</th>
                      <th className={thClass}>Device</th>
                      <th className={thClass}>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.loginEvents.map((e) => (
                      <tr key={e.id}>
                        <td className={`${tdClass} text-zinc-300`}>{formatDate(e.createdAt)}</td>
                        <td className={`${tdClass} text-zinc-400`}>{e.device || "—"}</td>
                        <td className={`${tdClass} text-zinc-500 font-mono text-xs`}>{e.ip || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-4 md:space-y-6">
          <Section title="Controls">
            <UserActions
              userId={user.id}
              userLabel={label}
              userEmail={user.email}
              blocked={blocked}
              role={role}
              emailVerified={!!user.emailVerifiedAt}
              canManage={!!viewer?.isAdmin}
              isProtected={user.id === viewer?.userId || isSuperAdminEmail(user.email)}
            />
          </Section>

          <Section title="Plan">
            <div className="px-5 py-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Current</span><PlanBadge plan={plan} /></div>
              <div className="flex justify-between"><span className="text-zinc-500">Valid until</span><span className="text-zinc-300">{expiresAt ? formatDate(expiresAt) : "—"}</span></div>
            </div>
          </Section>

          <Section title={`Payments (${user.payments.length})`}>
            {user.payments.length === 0 ? (
              <Empty>No payments.</Empty>
            ) : (
              <ul>
                {user.payments.map((p) => (
                  <li key={p.id} className="px-5 py-3 border-t border-zinc-800/70 first:border-t-0 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{p.plan}</span>
                      <span className="text-zinc-300">{p.method === "admin_grant" ? "Free" : formatInr(p.amount)}</span>
                      <span className="ml-auto"><Badge tone={paymentTone(p.status)}>{p.status.replace("_", " ")}</Badge></span>
                    </div>
                    <p className="text-zinc-500">
                      {p.method === "admin_grant" ? "Given by admin" : p.method === "upi" ? `UPI · UTR ${p.reference}` : "Razorpay"} · {formatDate(p.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Admin History">
            {logs.length === 0 ? (
              <Empty>No admin actions on this user.</Empty>
            ) : (
              <ul>
                {logs.map((log) => (
                  <li key={log.id} className="px-5 py-3 border-t border-zinc-800/70 first:border-t-0 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge>{log.action.replace(/_/g, " ")}</Badge>
                      <span className="text-zinc-600 ml-auto">{ago(log.createdAt)}</span>
                    </div>
                    {log.details && <p className="text-zinc-400">{log.details}</p>}
                    <p className="text-zinc-600">by {log.adminEmail}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
