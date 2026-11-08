"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/logs", label: "Audit Log" },
];

export default function AdminNav({ pendingPayments }: { pendingPayments: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto no-scrollbar">
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition flex items-center gap-2 ${
              active ? "bg-amber-500 text-black" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            {link.label}
            {link.href === "/admin/payments" && pendingPayments > 0 && (
              <span className={`text-[10px] px-1.5 rounded-full ${active ? "bg-black text-amber-400" : "bg-amber-500 text-black"}`}>
                {pendingPayments}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
