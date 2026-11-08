import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business-info";
import { PLANS, PLAN_DURATION_DAYS } from "@/lib/plans";

export const metadata = { title: "Terms & Conditions - IgniteQR" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>
        These Terms govern your use of {BUSINESS.name} (the &quot;Service&quot;), an online tool that helps businesses collect
        customer feedback through QR codes and invite customers to leave reviews on Google. By creating an account or
        using the Service, you agree to these Terms.
      </p>

      <h2>1. Your account</h2>
      <ul>
        <li>You must provide accurate information and be at least 18 years old.</li>
        <li>You are responsible for keeping your password safe and for all activity under your account.</li>
        <li>Tell us immediately at <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> if you suspect unauthorised use.</li>
      </ul>

      <h2>2. Plans and payments</h2>
      <ul>
        <li>
          The Starter plan is free. Paid plans are {PLANS.Professional.label} (₹{PLANS.Professional.priceInr}) and{" "}
          {PLANS.Enterprise.label} (₹{PLANS.Enterprise.priceInr}), each giving {PLAN_DURATION_DAYS} days of access per payment.
          Prices are in Indian Rupees and include applicable taxes unless stated otherwise.
        </li>
        <li>Payments are processed securely by Razorpay. We do not store your card, UPI or bank details.</li>
        <li>Paid plans do not renew automatically. When a plan ends, your account moves to the Starter plan until you renew.</li>
        <li>Plan limits (locations, monthly feedback, AI suggestions) are shown on our pricing page and may change with notice.</li>
        <li>Refunds are handled under our <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link>.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <ul>
        <li>Do not use the Service to create fake reviews, pay for reviews, or pressure customers to change their reviews.</li>
        <li>
          You must follow Google&apos;s review policies. Review suggestions are only a starting point — customers should
          describe their real experience in their own words.
        </li>
        <li>Do not misuse the Service, attempt to break its security, or use it for anything unlawful.</li>
      </ul>

      <h2>4. Your data and your customers&apos; data</h2>
      <p>
        You own the business information and feedback collected through your QR codes. We process it only to provide the
        Service, as described in our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>5. Suspension and termination</h2>
      <p>
        You can stop using the Service at any time. We may suspend or close accounts that break these Terms, misuse the
        Service or harm other users. You can ask us to delete your account and data by emailing us.
      </p>

      <h2>6. Availability and liability</h2>
      <ul>
        <li>We work to keep the Service available, but it is provided &quot;as is&quot; without guarantees of uninterrupted access.</li>
        <li>We are not responsible for decisions made by Google or other platforms about reviews posted there.</li>
        <li>
          To the extent allowed by law, our total liability for any claim is limited to the amount you paid us in the 3
          months before the claim.
        </li>
      </ul>

      <h2>7. Changes</h2>
      <p>We may update these Terms. We will post the new version here and update the date above.</p>

      <h2>8. Governing law</h2>
      <p>These Terms are governed by the laws of India. Courts in India have jurisdiction over any disputes.</p>

      <h2>9. Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or visit our <Link href="/contact">Contact page</Link>.
      </p>
    </LegalPage>
  );
}
