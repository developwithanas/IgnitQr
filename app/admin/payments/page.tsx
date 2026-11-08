export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatInr, ago } from "@/lib/admin";
import { Badge, Empty, Section, StatCard, tableClass, tdClass, thClass } from "@/components/admin/ui";
import PaymentReviewButtons from "@/components/admin/PaymentReviewButtons";

const statusTone = (status: string) =>
  status === "paid" ? "green" : status === "pending_review" ? "amber" : status === "rejected" || status === "failed" ? "red" : "default";

const methodLabel = (method: string) =>
  method === "admin_grant" ? "Free (admin)" : method === "upi" ? "UPI (manual)" : "Razorpay";

export default async function AdminPaymentsPage() {
  const [pending, recent, paidTotal, paidCount] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "pending_review" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.payment.findMany({
      where: { status: { not: "pending_review" } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "paid", method: { not: "admin_grant" } } }),
    prisma.payment.count({ where: { status: "paid", method: { not: "admin_grant" } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Payments</h1>
        <p className="text-sm text-zinc-500">Approve UPI payments after checking the UTR in your bank app.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Waiting for Approval" value={pending.length} tone={pending.length ? "amber" : "default"} />
        <StatCard label="Total Collected" value={formatInr(paidTotal._sum.amount ?? 0)} tone="green" />
        <StatCard label="Paid Transactions" value={paidCount} />
      </div>

      <Section title={`Waiting for Approval (${pending.length})`}>
        {pending.length === 0 ? (
          <Empty>No UPI payments waiting. 🎉</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>User</th>
                  <th className={thClass}>Plan</th>
                  <th className={thClass}>Amount</th>
                  <th className={thClass}>UTR</th>
                  <th className={thClass}>Submitted</th>
                  <th className={thClass}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id}>
                    <td className={tdClass}>
                      <Link href={`/admin/users/${p.user.id}`} className="font-bold text-white hover:text-amber-400">
                        {p.user.name || p.user.email}
                      </Link>
                      <p className="text-xs text-zinc-500">{p.user.email}</p>
                    </td>
                    <td className={`${tdClass} text-zinc-300`}>{p.plan}</td>
                    <td className={`${tdClass} text-white font-bold`}>
                      {formatInr(p.amount)}
                      {p.coupon && <span className="text-xs text-zinc-500 font-normal"> ({p.coupon})</span>}
                    </td>
                    <td className={`${tdClass} font-mono text-amber-300`}>{p.reference}</td>
                    <td className={`${tdClass} text-zinc-500`}>{ago(p.createdAt)}</td>
                    <td className={tdClass}>
                      <PaymentReviewButtons
                        paymentId={p.id}
                        summary={`${formatInr(p.amount)} from ${p.user.email} (UTR ${p.reference})`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="All Payments (latest 100)">
        {recent.length === 0 ? (
          <Empty>No payments yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>User</th>
                  <th className={thClass}>Plan</th>
                  <th className={thClass}>Amount</th>
                  <th className={thClass}>Method</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Reference</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td className={`${tdClass} text-zinc-400`}>{formatDate(p.createdAt)}</td>
                    <td className={tdClass}>
                      <Link href={`/admin/users/${p.user.id}`} className="text-zinc-200 hover:text-amber-400">{p.user.email}</Link>
                    </td>
                    <td className={`${tdClass} text-zinc-300`}>{p.plan}</td>
                    <td className={`${tdClass} text-zinc-200`}>{p.method === "admin_grant" ? "Free" : formatInr(p.amount)}</td>
                    <td className={`${tdClass} text-zinc-400`}>{methodLabel(p.method)}</td>
                    <td className={tdClass}><Badge tone={statusTone(p.status)}>{p.status.replace("_", " ")}</Badge></td>
                    <td className={`${tdClass} text-zinc-500 font-mono text-xs`}>{p.paymentId || p.reference || p.orderId || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
