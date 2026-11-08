import { Resend } from "resend";

// Until a domain is verified in Resend, onboarding@resend.dev can only deliver
// to the Resend account owner's own address. Set RESEND_FROM_EMAIL (e.g.
// "IgniteQR <no-reply@yourdomain.com>") after verifying your domain.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "IgniteQR <onboarding@resend.dev>";

/** Sends an email through Resend. Returns false (and logs) instead of throwing. */
export async function sendEmail(params: { to: string; subject: string; text: string; html: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY missing — cannot send email");
    return false;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM_EMAIL, ...params });
    if (error) {
      console.error(`Resend error (to ${params.to}):`, error.message || error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("sendEmail error:", error);
    return false;
  }
}

/** Simple branded HTML wrapper for transactional emails. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#111">
  <p style="font-size:20px;font-weight:bold;margin:0 0 20px">Ignite<span style="color:#2563eb">QR</span></p>
  <h2 style="margin:0 0 16px">${title}</h2>
  ${bodyHtml}
  <p style="font-size:12px;color:#888;margin-top:32px">You received this email because of activity on your IgniteQR account.</p>
</div>`;
}
