import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { emailLayout, sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/site-url";

export const RESET_TOKEN_TTL_MINUTES = 30;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Creates a single-use reset token (older unused tokens are cancelled). Returns the raw token. */
export async function createResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
      },
    }),
  ]);
  return token;
}

export function buildResetUrl(token: string, req: Request): string {
  return `${getBaseUrl(req)}/reset-password?token=${encodeURIComponent(token)}`;
}

/** Finds a valid (unused, unexpired) token record. */
export async function findValidResetToken(token: string) {
  if (!token || token.length < 20) return null;
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) return null;
  return record;
}

export async function sendResetEmail(to: string, name: string | null, resetUrl: string): Promise<boolean> {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return sendEmail({
    to,
    subject: "Reset your IgniteQR password",
    text: `${greeting}\n\nWe received a request to reset your IgniteQR password.\n\nReset it here (valid for ${RESET_TOKEN_TTL_MINUTES} minutes):\n${resetUrl}\n\nIf you didn't ask for this, you can ignore this email — your password won't change.\n\n— IgniteQR`,
    html: emailLayout(
      "Reset your password",
      `<p>${greeting}</p>
  <p>We received a request to reset your IgniteQR password. This link is valid for ${RESET_TOKEN_TTL_MINUTES} minutes.</p>
  <p style="margin:28px 0"><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a></p>
  <p style="font-size:13px;color:#555">If the button doesn't work, copy this link:<br><span style="word-break:break-all">${resetUrl}</span></p>
  <p style="font-size:13px;color:#555">If you didn't ask for this, ignore this email — your password won't change.</p>`
    ),
  });
}
