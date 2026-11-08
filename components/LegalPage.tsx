import Link from "next/link";
import { BUSINESS } from "@/lib/business-info";

const LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund-policy", label: "Refunds" },
  { href: "/contact", label: "Contact" },
];

/** Shared layout for Terms, Privacy, Refund and Contact pages. */
export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300">
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-black tracking-tight text-white">
            Ignite<span className="text-amber-500">QR</span>
          </Link>
          <nav className="flex gap-4 text-xs font-bold uppercase tracking-widest">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-zinc-500 hover:text-white transition">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{title}</h1>
        <p className="text-sm text-zinc-500 mt-2">Last updated: {BUSINESS.lastUpdated}</p>
        <div className="mt-8 space-y-6 leading-relaxed text-[15px] [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-white [&_h2]:mt-10 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_a]:text-amber-400 [&_a:hover]:underline">
          {children}
        </div>
      </main>
      <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-600">
        © 2026 {BUSINESS.name} ·{" "}
        <a href={`mailto:${BUSINESS.email}`} className="hover:text-zinc-400">{BUSINESS.email}</a>
      </footer>
    </div>
  );
}
