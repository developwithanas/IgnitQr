import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { emailLayout, sendEmail } from "@/lib/email";

export const OTP_TTL_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

/**
 * When "true", users must verify their email before using the dashboard.
 * Keep it off until your domain is verified in Resend — otherwise customers
 * can't receive the code.
 */
export function isEmailVerificationRequired(): boolean {
  return process.env.REQUIRE_EMAIL_VERIFICATION === "true";
}

function hashCode(userId: string, code: string): string {
  return crypto.createHash("sha256").update(`${userId}:${code}`).digest("hex");
}

/** Seconds until another code may be sent (0 = can send now). */
export async function getResendCooldown(userId: string): Promise<number> {
  const last = await prisma.emailOtp.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  if (!last) return 0;
  const elapsed = (Date.now() - last.createdAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed));
}

/** Creates a 6-digit code (cancelling older ones) and emails it. */
export async function sendVerificationCode(user: { id: string; email: string; name: string | null }): Promise<
  { ok: true } | { ok: false; reason: "cooldown"; wait: number } | { ok: false; reason: "send_failed" }
> {
  const wait = await getResendCooldown(user.id);
  if (wait > 0) return { ok: false, reason: "cooldown", wait };

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  await prisma.$transaction([
    prisma.emailOtp.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.emailOtp.create({
      data: {
        userId: user.id,
        codeHash: hashCode(user.id, code),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    }),
  ]);

  const greeting = user.name ? `Hi ${user.name},` : "Hi,";
  const sent = await sendEmail({
    to: user.email,
    subject: `${code} is your IgniteQR verification code`,
    text: `${greeting}\n\nYour IgniteQR verification code is: ${code}\n\nIt expires in ${OTP_TTL_MINUTES} minutes. If you didn't create an account, ignore this email.\n\n— IgniteQR`,
    html: emailLayout(
      "Verify your email",
      `<p>${greeting}</p>
  <p>Enter this code to verify your email. It expires in ${OTP_TTL_MINUTES} minutes.</p>
  <p style="font-size:34px;font-weight:bold;letter-spacing:8px;margin:24px 0;color:#2563eb">${code}</p>
  <p style="font-size:13px;color:#555">If you didn't create an IgniteQR account, you can ignore this email.</p>`
    ),
  });
  return sent ? { ok: true } : { ok: false, reason: "send_failed" };
}

/** Checks a code. On success marks the email as verified. */
export async function verifyCode(userId: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const clean = (code || "").replace(/\D/g, "");
  if (clean.length !== 6) return { ok: false, error: "Enter the 6-digit code from your email" };

  const otp = await prisma.emailOtp.findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This code has expired. Please request a new one." };
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many wrong attempts. Please request a new code." };
  }

  const a = Buffer.from(otp.codeHash);
  const b = Buffer.from(hashCode(userId, clean));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await prisma.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    const left = MAX_ATTEMPTS - otp.attempts - 1;
    return { ok: false, error: left > 0 ? `Wrong code. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong attempts. Please request a new code." };
  }

  await prisma.$transaction([
    prisma.emailOtp.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } }),
  ]);
  return { ok: true };
}
