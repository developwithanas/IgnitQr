import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business-info";

export const metadata = { title: "Contact Us - IgniteQR" };

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>We&apos;re happy to help with questions about your account, payments, refunds or using {BUSINESS.name}.</p>

      <div className="grid gap-4 sm:grid-cols-2 not-prose">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</p>
          <a href={`mailto:${BUSINESS.email}`} className="text-white font-bold break-all">{BUSINESS.email}</a>
          <p className="text-xs text-zinc-500 mt-1">We reply within 1–2 working days.</p>
        </div>
        {BUSINESS.phone && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Phone / WhatsApp</p>
            <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`} className="text-white font-bold">{BUSINESS.phone}</a>
          </div>
        )}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Support hours</p>
          <p className="text-white font-bold">{BUSINESS.supportHours}</p>
        </div>
        {BUSINESS.address && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Address</p>
            <p className="text-white font-bold whitespace-pre-line">{BUSINESS.address}</p>
          </div>
        )}
      </div>

      <p>
        You can also send us a message using the <Link href="/#contact">contact form on our homepage</Link>.
      </p>
      <p className="text-sm text-zinc-500">
        Business name: {BUSINESS.name}. For refunds, see our <Link href="/refund-policy">Refund Policy</Link>.
      </p>
    </LegalPage>
  );
}
