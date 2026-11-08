export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession, isBlocked, resolveRole } from "@/lib/auth";
import CreateUserButton from "@/components/admin/CreateUserButton";
import { ONLINE_WINDOW_MS, formatDuration, istDay, isOnline, timeAgo, ago } from "@/lib/admin";
import { getBusinessStatsByUser } from "@/lib/admin-data";
import { getEffectivePlan } from "@/lib/plans";
import { Badge, Empty, OnlineDot, PlanBadge, tableClass, tdClass, thClass } from "@/components/admin/ui";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "online", label: "Online now" },
  { key: "today", label: "Active today" },
  { key: "inactive", label: "Inactive 7+ days" },
  { key: "no-business", label: "No business yet" },
  { key: "paid", label: "Paid" },
  { key: "blocked", label: "Blocked" },
  { key: "staff", label: "Staff" },
  { key: "unverified", label: "Unverified email" },
] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q = "", filter = "all" } = await searchParams;
  const viewer = await getSession();
  const now = new Date();
  const today = istDay(now);
  const search = q.trim();

  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }
  if (filter === "online") where.lastSeenAt = { gte: new Date(now.getTime() - ONLINE_WINDOW_MS) };
  if (filter === "today") where.activityDays = { some: { day: today } };
  if (filter === "inactive") {
    where.AND = [{ OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: new Date(now.getTime() - 7 * 86400000) } }] }];
  }
  if (filter === "paid") {
    where.plan = { not: "Starter" };
    where.planExpiresAt = { gt: now };
  }
  if (filter === "blocked") where.status = "blocked";
  if (filter === "staff") where.role = { in: ["staff", "admin"] };
  if (filter === "unverified") where.emailVerifiedAt = null;

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ lastSeenAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take: 500,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      plan: true,
      planExpiresAt: true,
      role: true,
      status: true,
      blockedUntil: true,
      lastLoginAt: true,
      loginCount: true,
      lastSeenAt: true,
      activeSeconds: true,
      emailVerifiedAt: true,
      googleId: true,
      activityDays: { where: { day: today }, select: { seconds: true } },
    },
  });

  const stats = await getBusinessStatsByUser(users.map((u) => u.id));
  const rows = filter === "no-business" ? users.filter((u) => !stats.get(u.id)) : users;

  const filterHref = (key: string) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (key !== "all") params.set("filter", key);
    const qs = params.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Users</h1>
          <p className="text-sm text-zinc-500">{rows.length} {rows.length === 1 ? "user" : "users"}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        {viewer?.isAdmin && <CreateUserButton />}
        <form action="/admin/users" className="flex gap-2 w-full md:w-auto">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <input
            name="q"
            defaultValue={search}
            placeholder="Search name or email"
            className="flex-1 md:w-72 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
          />
          <button className="bg-amber-500 text-black px-4 rounded-xl text-xs font-black uppercase tracking-widest">Search</button>
        </form>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={filterHref(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
              filter === f.key
                ? "bg-white text-black border-white"
                : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-x-auto">
        {rows.length === 0 ? (
          <Empty>No users match this filter.</Empty>
        ) : (
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>User</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Last Seen</th>
                <th className={thClass}>Last Login</th>
                <th className={thClass}>Logins</th>
                <th className={thClass}>Today</th>
                <th className={thClass}>Total Time</th>
                <th className={thClass}>Plan</th>
                <th className={thClass}>Business</th>
                <th className={thClass}>Scans</th>
                <th className={thClass}>Reviews</th>
                <th className={thClass}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const s = stats.get(u.id);
                const role = resolveRole(u.email, u.role, !!u.emailVerifiedAt);
                const blocked = isBlocked(u);
                const { plan, expiresAt } = getEffectivePlan(u);
                const online = isOnline(u.lastSeenAt);
                return (
                  <tr key={u.id} className="hover:bg-zinc-900/50 transition">
                    <td className={tdClass}>
                      <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 group">
                        <OnlineDot online={online} />
                        <div className="min-w-0">
                          <p className="font-bold text-white group-hover:text-amber-400 transition truncate max-w-[220px]">
                            {u.name || u.email.split("@")[0]}
                          </p>
                          <p className="text-xs text-zinc-500 truncate max-w-[220px]">{u.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className={tdClass}>
                      <div className="flex gap-1">
                        {blocked ? <Badge tone="red">Blocked</Badge> : <Badge tone="green">Active</Badge>}
                        {role === "admin" && <Badge tone="amber">Admin</Badge>}
                        {role === "staff" && <Badge tone="blue">Staff</Badge>}
                        {!u.emailVerifiedAt && <Badge tone="amber">Unverified</Badge>}
                        {u.googleId && <Badge>Google</Badge>}
                      </div>
                    </td>
                    <td className={`${tdClass} ${online ? "text-green-400 font-bold" : "text-zinc-400"}`}>{timeAgo(u.lastSeenAt)}</td>
                    <td className={`${tdClass} text-zinc-400`}>{u.lastLoginAt ? ago(u.lastLoginAt) : "Never"}</td>
                    <td className={`${tdClass} text-zinc-300`}>{u.loginCount}</td>
                    <td className={`${tdClass} text-zinc-300`}>{formatDuration(u.activityDays[0]?.seconds ?? 0)}</td>
                    <td className={`${tdClass} text-zinc-300`}>{formatDuration(u.activeSeconds)}</td>
                    <td className={tdClass}>
                      <PlanBadge plan={plan} />
                      {expiresAt && <p className="text-[10px] text-zinc-500 mt-1">till {expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>}
                    </td>
                    <td className={tdClass}>{s ? <span className="text-zinc-300">{s.businesses}</span> : <Badge tone="amber">None</Badge>}</td>
                    <td className={`${tdClass} text-zinc-300`}>{s?.scans ?? 0}</td>
                    <td className={`${tdClass} text-zinc-300`}>{s?.reviews ?? 0}</td>
                    <td className={`${tdClass} text-zinc-500`}>{u.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
