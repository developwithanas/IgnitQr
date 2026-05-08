import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ReviewsPage() {
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

    return (
      <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
          <Link 
            href="/dashboard"
            className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
            All Reviews
          </h1>
        </div>

        <div className="bg-[#111111] border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Rating</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Review Content</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {allFeedbacks.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/20 transition">
                    <td className="p-4 text-sm text-zinc-300 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg 
                            key={star} 
                            className={`w-4 h-4 ${star <= item.rating ? "text-yellow-400" : "text-zinc-700"}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-zinc-400 italic">
                      "{item.content || "No comment provided"}"
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                        item.aiContent === 'Posted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        item.aiContent === 'Replied' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {item.aiContent === 'Posted' ? 'Posted' : item.aiContent === 'Replied' ? 'Replied' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {allFeedbacks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-zinc-500">
                      No reviews found. Share your QR code to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Reviews Error:", error);
    return <div className="text-white p-10">Error loading reviews.</div>;
  }
}
