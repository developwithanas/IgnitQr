import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  try {
    const business = await prisma.business.findFirst({
      where: { userId },
      orderBy: { id: "desc" },
      include: {
        qrCodes: {
          include: {
            feedbacks: {
              orderBy: { createdAt: 'desc' }
            },
          },
        },
      },
    });

    const allFeedbacks = business?.qrCodes.flatMap((qr) => qr.feedbacks).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) || [];
    
    // Calculate Stats
    const totalCustomers = allFeedbacks.length;
    const avgScore = totalCustomers > 0 
      ? (allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCustomers).toFixed(1) 
      : "0.0";

    const promoters = allFeedbacks.filter(f => f.rating >= 4).length;
    const passives = allFeedbacks.filter(f => f.rating === 3).length;
    const detractors = allFeedbacks.filter(f => f.rating <= 2).length;

    const stats = {
      totalCustomers,
      avgScore,
      pieData: [
        { name: "Promoters", value: promoters, color: "#22c55e" },
        { name: "Passives", value: passives, color: "#94a3b8" },
        { name: "Detractors", value: detractors, color: "#ef4444" },
      ]
    };

    // Extract serializable data
    const feedbacksData = allFeedbacks.map(f => ({
      id: f.id,
      customerName: f.customerName,
      content: f.content,
      rating: f.rating,
      customerStatus: f.customerStatus,
      createdAt: f.createdAt.toISOString()
    }));

    return (
      <CustomersClient initialFeedbacks={feedbacksData} stats={stats} />
    );
  } catch (error) {
    console.error("Customers Error:", error);
    return <div className="text-white p-10">Error loading customers dashboard.</div>;
  }
}
