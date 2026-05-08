export default function FeedbackTable({ data }: { data: any[] }) {
  return (
    <div className="bg-[#1e293b]/50 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-md">
      <div className="p-8 border-b border-slate-800 bg-slate-800/20">
        <h3 className="font-black text-white uppercase tracking-tighter">Latest Feedback</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#0f172a]/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="p-6">Rating</th>
              <th className="p-6">Customer</th>
              <th className="p-6">Review Content</th>
              <th className="p-6">Date</th>
              <th className="p-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((rev: any) => (
              <tr key={rev.id} className="hover:bg-white/5 transition-colors">
                <td className="p-6">
                  <span className="text-orange-500 font-bold">{rev.rating} ★</span>
                </td>
                <td className="p-6 font-medium text-white italic">{rev.customerName || "Anonymous"}</td>
                <td className="p-6 text-slate-400 text-sm truncate max-w-xs group-hover:text-slate-200">
                  "{rev.content || "No comment provided"}"
                </td>
                <td className="p-6 text-slate-500 text-xs font-bold">
                  {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td className="p-6 text-right">
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                    rev.aiContent === 'Posted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    rev.aiContent === 'Replied' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {rev.aiContent === 'Posted' ? 'Posted' : rev.aiContent === 'Replied' ? 'Replied' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="p-20 text-center text-slate-600 font-bold italic uppercase tracking-widest">
            No reviews found in database
          </div>
        )}
      </div>
    </div>
  );
}