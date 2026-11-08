export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/admin";
import { Badge, Empty, tableClass, tdClass, thClass } from "@/components/admin/ui";

const actionTone = (action: string) =>
  action === "block" || action === "reject_payment" || action === "delete_user"
    ? "red"
    : action === "unblock" || action === "approve_payment" || action === "create_user"
      ? "green"
      : action === "grant_plan" || action === "set_plan"
        ? "amber"
        : "default";

export default async function AdminLogsPage() {
  const logs = await prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Audit Log</h1>
        <p className="text-sm text-zinc-500">Every action taken in the admin panel, and who took it.</p>
      </div>

      <div className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-x-auto">
        {logs.length === 0 ? (
          <Empty>No admin actions yet.</Empty>
        ) : (
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>When</th>
                <th className={thClass}>Action</th>
                <th className={thClass}>User</th>
                <th className={thClass}>Details</th>
                <th className={thClass}>Done By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className={`${tdClass} text-zinc-400`}>{formatDate(log.createdAt)}</td>
                  <td className={tdClass}><Badge tone={actionTone(log.action)}>{log.action.replace(/_/g, " ")}</Badge></td>
                  <td className={tdClass}>
                    {log.targetUserId && log.action !== "delete_user" ? (
                      <Link href={`/admin/users/${log.targetUserId}`} className="text-zinc-200 hover:text-amber-400">{log.targetEmail}</Link>
                    ) : log.targetEmail || "—"}
                  </td>
                  <td className={`${tdClass} text-zinc-400 whitespace-normal min-w-[200px]`}>{log.details || "—"}</td>
                  <td className={`${tdClass} text-zinc-500`}>{log.adminEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
