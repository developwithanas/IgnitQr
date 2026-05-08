import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import SummaryCards from "@/components/SummaryCards";
import VisualAnalytics from "@/components/VisualAnalytics";
import FeedbackTable from "@/components/FeedbackTable";
import CreateStore from "@/components/CreateStore";
import QRDisplay from "@/components/QRDisplay";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  try {
    const business = await prisma.business.findFirst({
      where: {
        userId,
      },
      // Ensure we grab the most recently created store
      orderBy: {
        id: "desc"
      },
      include: {
        qrCodes: {
          include: {
            feedbacks: true,
          },
        },
      },
    });

    const allFeedbacks =
      business?.qrCodes.flatMap((qr) => qr.feedbacks).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) || [];

    const totalReviews = allFeedbacks.length;

    const totalRating = allFeedbacks.reduce(
      (sum, feedback) => sum + feedback.rating,
      0
    );

    const avgRating =
      totalReviews > 0
        ? (totalRating / totalReviews).toFixed(1)
        : "0.0";

    const totalScans = business?.qrCodes.reduce((sum, qr) => sum + qr.scans, 0) || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayActivity = allFeedbacks.filter(
      (f) => new Date(f.createdAt) >= today
    ).length;

    return (
      <div className="max-w-[1600px] mx-auto space-y-8 pb-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
              Dashboard Overview
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/reviews"
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl transition text-sm font-semibold flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
              All Reviews
            </Link>

            {/* Create Store is now our Add Dropdown */}
            <CreateStore />
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards
          totalReviews={totalReviews}
          avgRating={avgRating}
          totalScans={totalScans}
          todayActivity={todayActivity}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content Area: Charts & Feedback */}
          <div className="xl:col-span-2 space-y-6">
            <VisualAnalytics feedbacks={allFeedbacks} />
            <FeedbackTable data={allFeedbacks} />
          </div>

          {/* Right Sidebar Area: Active Store */}
          <div className="space-y-6">
            {business ? (
              <div className="bg-[#111111] border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <h2 className="text-white font-semibold text-xl mb-1">
                  {business.name}
                </h2>
                <a
                  href={business.googleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 text-sm hover:text-blue-400 transition mb-6"
                >
                  View on Google Maps
                </a>

                <div className="bg-white p-4 rounded-xl w-full flex justify-center mb-4 shadow-sm border border-zinc-200">
                  <QRDisplay feedbackId={business.qrCodes?.[0]?.id} />
                </div>
                
                <p className="text-xs text-zinc-500 mt-2">
                  Scan to leave a review
                </p>
              </div>
            ) : (
              <div className="bg-[#111111] border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center text-zinc-500">
                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                <p className="font-medium">No active store.</p>
                <p className="text-sm mt-1">Click "Add" to create one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 text-center text-zinc-500 text-xs font-medium">
          IgniteQR Engine v2.0 • Data Encrypted
        </footer>

      </div>
    );

  } catch (error) {
    console.error("Dashboard Error:", error);

    return (
      <div className="text-white p-10">
        Error loading dashboard. Please check database connection.
      </div>
    );
  }
}