import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdminEmail } from "@/lib/auth";
import { logAdminAction, requireAdminApi } from "@/lib/admin";
import { PLANS, type PlanName } from "@/lib/plans";
import { buildResetUrl, createResetToken } from "@/lib/password-reset";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

// POST /api/admin/users/:id  { action, ... }
// Actions: block, unblock, force_logout, grant_plan, set_role (Super Admin only)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session: admin, error } = await requireAdminApi("admin");
  if (error) return error;

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const isSelf = target.id === admin.userId;
  const protectedTarget = isSuperAdminEmail(target.email);
  const who = { id: target.id, email: target.email };

  try {
    switch (action) {
      case "block": {
        if (isSelf || protectedTarget) {
          return NextResponse.json({ error: "This account cannot be blocked" }, { status: 400 });
        }
        const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : "";
        const days = Number(body.days) || 0; // 0 = until unblocked
        const blockedUntil = days > 0 ? new Date(Date.now() + days * DAY_MS) : null;
        await prisma.user.update({
          where: { id },
          data: {
            status: "blocked",
            blockedReason: reason || null,
            blockedUntil,
            tokenVersion: { increment: 1 }, // logs them out everywhere
          },
        });
        await logAdminAction(admin, "block", who, `${days > 0 ? `${days} days` : "until unblocked"}${reason ? ` — ${reason}` : ""}`);
        break;
      }

      case "unblock": {
        await prisma.user.update({
          where: { id },
          data: { status: "active", blockedReason: null, blockedUntil: null },
        });
        await logAdminAction(admin, "unblock", who);
        break;
      }

      case "force_logout": {
        await prisma.user.update({ where: { id }, data: { tokenVersion: { increment: 1 } } });
        await logAdminAction(admin, "force_logout", who);
        break;
      }

      case "grant_plan": {
        const plan = body.plan as PlanName;
        if (!(plan in PLANS)) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

        if (plan === "Starter") {
          await prisma.user.update({ where: { id }, data: { plan: "Starter", planExpiresAt: null } });
          await logAdminAction(admin, "set_plan", who, "Downgraded to Starter");
          break;
        }

        const days = Math.floor(Number(body.days));
        if (!days || days < 1 || days > 3650) {
          return NextResponse.json({ error: "Days must be between 1 and 3650" }, { status: 400 });
        }
        // Extend if they already have this plan active, otherwise start today.
        const base =
          target.plan === plan && target.planExpiresAt && target.planExpiresAt.getTime() > Date.now()
            ? target.planExpiresAt
            : new Date();
        const expiresAt = new Date(base.getTime() + days * DAY_MS);

        await prisma.$transaction([
          prisma.user.update({ where: { id }, data: { plan, planExpiresAt: expiresAt } }),
          prisma.payment.create({
            data: { userId: id, plan, amount: 0, method: "admin_grant", status: "paid", reference: `by ${admin.email}` },
          }),
        ]);
        await logAdminAction(admin, "grant_plan", who, `${plan} for ${days} days (free)`);
        break;
      }

      case "set_role": {
        const role = body.role;
        if (role !== "user" && role !== "staff") {
          return NextResponse.json({ error: "Role must be user or staff" }, { status: 400 });
        }
        if (isSelf || protectedTarget) {
          return NextResponse.json({ error: "This account's role cannot be changed" }, { status: 400 });
        }
        await prisma.user.update({ where: { id }, data: { role } });
        await logAdminAction(admin, "set_role", who, role);
        break;
      }

      case "mark_verified": {
        await prisma.user.update({ where: { id }, data: { emailVerifiedAt: new Date() } });
        await logAdminAction(admin, "mark_verified", who, "Email marked as verified manually");
        break;
      }

      case "reset_link": {
        // Admin creates a reset link to share with the user directly (e.g. WhatsApp)
        // — useful when the reset email doesn't arrive.
        const token = await createResetToken(id);
        const resetUrl = buildResetUrl(token, req);
        await logAdminAction(admin, "reset_link", who, "Created password reset link (valid 30 min)");
        return NextResponse.json({ success: true, resetUrl });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ADMIN_USER_ACTION_ERROR:", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

// DELETE /api/admin/users/:id  { confirmEmail }
// Permanently deletes the account and everything it owns (businesses, QR codes,
// reviews, payment records, login history). Super Admin only; typed-email confirmation.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session: admin, error } = await requireAdminApi("admin");
  if (error) return error;

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.id === admin.userId || isSuperAdminEmail(target.email)) {
    return NextResponse.json({ error: "This account cannot be deleted" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const confirmEmail = typeof body.confirmEmail === "string" ? body.confirmEmail.trim().toLowerCase() : "";
  if (confirmEmail !== target.email) {
    return NextResponse.json({ error: "Type the user's email exactly to confirm" }, { status: 400 });
  }

  try {
    const businesses = await prisma.business.findMany({ where: { userId: id }, select: { id: true } });
    const businessIds = businesses.map((b) => b.id);

    const [feedbacks, qrCodes, , payments] = await prisma.$transaction([
      prisma.feedback.deleteMany({ where: { qrCode: { businessId: { in: businessIds } } } }),
      prisma.qrCode.deleteMany({ where: { businessId: { in: businessIds } } }),
      prisma.business.deleteMany({ where: { id: { in: businessIds } } }),
      prisma.payment.deleteMany({ where: { userId: id } }),
      // Login history, activity, reset tokens and OTPs are removed by cascade.
      prisma.user.delete({ where: { id } }),
    ]);

    await logAdminAction(
      admin,
      "delete_user",
      { id, email: target.email },
      `Deleted ${businessIds.length} business(es), ${qrCodes.count} QR code(s), ${feedbacks.count} review(s), ${payments.count} payment record(s)`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ADMIN_DELETE_USER_ERROR:", err);
    return NextResponse.json({ error: "Could not delete account" }, { status: 500 });
  }
}
