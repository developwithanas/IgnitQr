interface SummaryProps {
  totalReviews: number;
  avgRating: string;
  totalScans: number;
  todayActivity: number;
}

export default function SummaryCards({ totalReviews, avgRating, totalScans, todayActivity }: SummaryProps) {
  const stats = [
    { id: 1, label: "Total Reviews", val: totalReviews.toLocaleString(), trend: "Lifetime", color: "text-blue-400" },
    { id: 2, label: "Average Rating", val: avgRating, trend: "Stable", color: "text-yellow-400", isStar: true },
    { id: 3, label: "Total QR Scans", val: totalScans.toLocaleString(), trend: "Engagement", color: "text-purple-400" },
    { id: 4, label: "Today's Activity", val: todayActivity.toLocaleString(), trend: "Last 24h", color: "text-green-400" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {stats.map((item) => (
        <div key={item.id} className="bg-[#111111] p-6 rounded-2xl border border-zinc-800 shadow-sm transition-transform hover:scale-105">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-600/10 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded-md">{item.id}</span>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{item.label}</p>
          </div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-semibold text-white tracking-tight">
              {item.val}
              {item.isStar && <span className="text-orange-500 text-2xl ml-1">★</span>}
            </h2>
            <span className={`text-[10px] font-semibold ${item.color} bg-white/5 px-2 py-1 rounded-lg`}>
              {item.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}