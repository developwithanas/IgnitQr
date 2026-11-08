export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";
import { getEffectivePlan, PLANS } from "@/lib/plans";

export default async function SettingsPage() {
  const session = await getSession();

  const user = session?.userId
    ? await prisma.user.findUnique({ where: { id: session.userId } })
    : null;

  const business = await prisma.business.findFirst({
    where: { userId: session?.userId },
    orderBy: { id: "desc" },
    include: {
      qrCodes: {
        include: {
          feedbacks: true,
        },
      },
    },
  });

  const { plan, expiresAt } = getEffectivePlan(user);
  const [lastPaid, pendingPayment] = session?.userId
    ? await Promise.all([
        prisma.payment.findFirst({
          where: { userId: session.userId, status: "paid" },
          orderBy: { createdAt: "desc" },
        }),
        prisma.payment.findFirst({
          where: { userId: session.userId, status: "pending_review" },
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [null, null];

  const billing = {
    plan,
    priceInr: PLANS[plan].priceInr,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    paymentMethod: lastPaid
      ? lastPaid.method === "upi"
        ? "UPI"
        : lastPaid.method === "admin_grant"
          ? "Complimentary"
          : "Razorpay"
      : null,
    pendingPlan: pendingPayment?.plan ?? null,
  };

  const userData = {
    firstName: user?.name?.split(" ")[0] || session?.name || "User",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    imageUrl: "",
    emailAddresses: [{ emailAddress: user?.email || session?.email || "" }],
  };

  const feedbacks = business?.qrCodes.flatMap((qr) => qr.feedbacks) || [];

  const businessData = business
    ? {
        id: business.id,
        name: business.name,
        googleLink: business.googleLink,
        qrCount: business.qrCodes.length,
        totalScans: business.qrCodes.reduce((sum, qr) => sum + qr.scans, 0),
        reviewCount: feedbacks.length,
        customers: feedbacks.map((f) => ({
          name: f.customerName,
          email: "N/A", // customer emails are not collected
          rating: f.rating,
          status: f.customerStatus,
          date: f.createdAt.toISOString(),
        })),
      }
    : null;

  return <SettingsClient user={userData} business={businessData} billing={billing} />;
}
