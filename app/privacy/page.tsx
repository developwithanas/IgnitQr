import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business-info";

export const metadata = { title: "Privacy Policy - IgniteQR" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what information {BUSINESS.name} collects, why, and the choices you have. We only collect what
        we need to run the Service.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and password (stored only in encrypted/hashed form). If you sign in with Google, we receive your name and email from Google.</li>
        <li><strong>Business details:</strong> business name, location and Google review link you add.</li>
        <li><strong>Customer feedback:</strong> star ratings, comments and (optionally) names that your customers submit through your QR code.</li>
        <li><strong>Payment records:</strong> plan, amount, date and Razorpay payment/order IDs. Card, UPI and bank details are handled by Razorpay — we never see or store them.</li>
        <li><strong>Usage and security data:</strong> login times, IP address, device and browser type, and time spent in the dashboard. We use this to keep accounts secure and improve the Service.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To create and run your account, dashboard and QR feedback pages.</li>
        <li>To process payments and activate plans.</li>
        <li>To send important emails such as password resets and verification codes.</li>
        <li>To prevent fraud and abuse, and to provide support.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>3. Services we use</h2>
      <ul>
        <li><strong>Razorpay</strong> — payment processing</li>
        <li><strong>Google</strong> — &quot;Sign in with Google&quot; and AI review suggestions (Gemini). Only the business name and rating are sent for suggestions.</li>
        <li><strong>Supabase</strong> — secure database hosting</li>
        <li><strong>Render</strong> — website hosting</li>
        <li><strong>Resend</strong> — sending emails</li>
      </ul>

      <h2>4. Cookies</h2>
      <p>We use a secure login cookie to keep you signed in. We do not use advertising cookies.</p>

      <h2>5. How long we keep data</h2>
      <p>
        We keep your data while your account is active. If you ask us to delete your account, we delete your account,
        businesses, QR codes, feedback and payment records from our systems, except where the law requires us to keep
        certain records.
      </p>

      <h2>6. Your rights</h2>
      <p>
        You can access, correct, export (Settings → Export CSV) or delete your data. To request deletion or ask a question,
        email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
      </p>

      <h2>7. Security</h2>
      <p>
        Passwords are hashed, connections use HTTPS, and access to admin tools is restricted and logged. No system is
        perfectly secure, but we work to protect your information.
      </p>

      <h2>8. Changes</h2>
      <p>We may update this policy. The latest version will always be on this page.</p>

      <p>
        Contact: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> · <Link href="/contact">Contact page</Link>
      </p>
    </LegalPage>
  );
}
