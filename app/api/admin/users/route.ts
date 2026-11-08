import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { logAdminAction, requireAdminApi } from "@/lib/admin";
import { PLANS, isPaidPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Readable random password, e.g. "Kp7m-Xq2r-9Tvw" (no look-alike characters). */
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const pick = () => chars[crypto.randomInt(chars.length)];
  return [0, 1, 2].map(() => Array.from({ length: 4 }, pick).join("")).join("-");
}

// POST /api/admin/users — Super Admin creates an account for a customer.
// { name?, email, password?, plan?, days? }  → { userId, password? (only if generated) }
export async function POST(req: Request) {
  const { session: admin, error } = await requireAdminApi("admin");
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 100) : null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    let password = typeof body.password === "string" ? body.password : "";
    const generated = !password;
    if (generated) password = generatePassword();
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const rawPlan: unknown = body.plan;
    const plan = isPaidPlan(rawPlan) ? rawPlan : null;
    const days = Math.floor(Number(body.days) || 0);
    if (plan && (days < 1 || days > 3650)) {
      return NextResponse.json({ error: "Plan days must be between 1 and 3650" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashPassword(password),
        // The admin created this account on purpose, so we treat the email as confirmed.
        emailVerifiedAt: new Date(),
        ...(plan ? { plan, planExpiresAt: new Date(Date.now() + days * DAY_MS) } : {}),
      },
    });

    if (plan) {
      await prisma.payment.create({
        data: { userId: user.id, plan, amount: 0, method: "admin_grant", status: "paid", reference: `by ${admin.email}` },
      });
    }

    await logAdminAction(
      admin,
      "create_user",
      { id: user.id, email: user.email },
      plan ? `With ${PLANS[plan].label} for ${days} days (free)` : "Starter plan"
    );

    return NextResponse.json({ success: true, userId: user.id, ...(generated ? { password } : {}) });
  } catch (err) {
    console.error("ADMIN_CREATE_USER_ERROR:", err);
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }
}
