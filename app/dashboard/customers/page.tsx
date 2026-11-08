export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/sign-in");
  }

  let errorMsg = "";
  let feedbacksData: any[] = [];
  let stats = {
    totalCustomers: 0,
    avgScore: "0.0",
    pieData: [
      { name: "Promoters", value: 0, color: "#22c55e" },
      { name: "Passives", value: 0, color: "#94a3b8" },
      { name: "Detractors", value: 0, color: "#ef4444" },
    ],
  };

  try {
    const business = await prisma.business.findFirst({
      where: { userId: session.userId },
      orderBy: { id: "desc" },
      include: {
        qrCodes: {
          include: {
            feedbacks: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    const allFeedbacks =
      business?.qrCodes
        .flatMap((qr) => qr.feedbacks)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) || [];

    const totalCustomers = allFeedbacks.length;
    const avgScore =
      totalCustomers > 0
        ? (allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCustomers).toFixed(1)
        : "0.0";

    const promoters = allFeedbacks.filter((f) => f.rating >= 4).length;
    const passives = allFeedbacks.filter((f) => f.rating === 3).length;
    const detractors = allFeedbacks.filter((f) => f.rating <= 2).length;

    stats = {
      totalCustomers,
      avgScore,
      pieData: [
        { name: "Promoters", value: promoters, color: "#22c55e" },
        { name: "Passives", value: passives, color: "#94a3b8" },
        { name: "Detractors", value: detractors, color: "#ef4444" },
      ],
    };

    feedbacksData = allFeedbacks.map((f) => ({
      id: f.id,
      customerName: f.customerName,
      content: f.content,
      rating: f.rating,
      customerStatus: f.customerStatus,
      createdAt: f.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Customers Error:", error);
    errorMsg = "Error loading customers dashboard.";
  }

  if (errorMsg) {
    return <div className="text-white p-10">{errorMsg}</div>;
  }

  return <CustomersClient initialFeedbacks={feedbacksData} stats={stats} />;
}
