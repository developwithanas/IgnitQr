import Link from "next/link";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "green" | "amber" | "red" | "blue";
  href?: string;
}) {
  const toneClass = {
    default: "text-white",
    green: "text-green-400",
    amber: "text-amber-400",
    red: "text-red-400",
    blue: "text-blue-400",
  }[tone];

  const body = (
    <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-5 h-full hover:border-zinc-700 transition">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
      <p className={`text-3xl font-black tracking-tight mt-2 ${toneClass}`}>{value}</p>
      {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "green" | "amber" | "red" | "blue" | "purple";
}) {
  const toneClass = {
    default: "bg-zinc-900 border-zinc-700 text-zinc-400",
    green: "bg-green-500/10 border-green-500/30 text-green-400",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    red: "bg-red-500/10 border-red-500/30 text-red-400",
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border whitespace-nowrap ${toneClass}`}>
      {children}
    </span>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">{title}</h2>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-zinc-500">{children}</p>;
}

export function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${online ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-zinc-700"}`}
    />
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  const tone = plan === "Enterprise" ? "purple" : plan === "Professional" ? "blue" : "default";
  return <Badge tone={tone}>{plan}</Badge>;
}

/** Simple horizontal bar list (no chart library needed). */
export function BarList({ rows }: { rows: { label: string; value: number; display: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="px-5 py-4 space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3 text-xs">
          <span className="w-16 shrink-0 text-zinc-500 font-bold">{row.label}</span>
          <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right text-zinc-300 font-bold">{row.display}</span>
        </div>
      ))}
    </div>
  );
}

export const tableClass = "w-full text-sm";
export const thClass = "text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 px-4 py-3 whitespace-nowrap";
export const tdClass = "px-4 py-3 border-t border-zinc-800/70 whitespace-nowrap";
