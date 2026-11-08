import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business-info";
import { PLAN_DURATION_DAYS } from "@/lib/plans";

export const metadata = { title: "Refund & Cancellation Policy - IgniteQR" };

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy">
      <h2>Cancellation</h2>
      <ul>
        <li>Paid plans are prepaid for {PLAN_DURATION_DAYS} days and <strong>do not renew automatically</strong> — there is nothing to cancel and you will never be charged again unless you choose to pay.</li>
        <li>Your plan stays active until the end of the period you paid for, then your account moves to the free Starter plan. Your data is kept.</li>
      </ul>

      <h2>Refunds</h2>
      <ul>
        <li>If you are not satisfied, you can request a full refund within <strong>7 days</strong> of your payment by emailing us.</li>
        <li>If you were charged twice or charged for a failed payment, we refund the extra amount in full.</li>
        <li>After 7 days, payments are non-refundable, but your plan remains active until it ends.</li>
      </ul>

      <h2>How to request a refund</h2>
      <p>
        Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> from your registered email address with your
        payment date and amount (or Razorpay payment ID). We reply within 2 working days.
      </p>

      <h2>Refund timeline</h2>
      <p>
        Approved refunds are sent back to the original payment method (card, UPI or bank account) through Razorpay and
        usually reach you within <strong>5–7 working days</strong>, depending on your bank.
      </p>

      <h2>Service delivery</h2>
      <p>
        {BUSINESS.name} is an online software service. Your plan is activated instantly after successful payment — there is
        no physical delivery or shipping.
      </p>

      <p>
        Questions? See our <Link href="/terms">Terms</Link> or <Link href="/contact">contact us</Link>.
      </p>
    </LegalPage>
  );
}
