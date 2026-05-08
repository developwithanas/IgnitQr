"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import CustomerCharts from "./CustomerCharts";
import AddCustomerModal from "@/components/AddCustomerModal";

export default function CustomersClient({ initialFeedbacks, stats }: { initialFeedbacks: any[], stats: any }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);

  // Recalculate stats whenever feedbacks change (e.g. after adding a new one)
  const dynamicStats = useMemo(() => {
    const total = feedbacks.length;
    const avg = total > 0 
      ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / total).toFixed(1) 
      : "0.0";

    const promoters = feedbacks.filter(f => f.rating >= 4).length;
    const passives = feedbacks.filter(f => f.rating === 3).length;
    const detractors = feedbacks.filter(f => f.rating <= 2).length;

    return {
      avgScore: avg,
      pieData: [
        { name: "Promoters", value: promoters, color: "#22c55e" },
        { name: "Passives", value: passives, color: "#94a3b8" },
        { name: "Detractors", value: detractors, color: "#ef4444" },
      ]
    };
  }, [feedbacks]);

  const filteredFeedbacks = feedbacks.filter(f => 
    (f.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (f.content?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = (newCustomer: any) => {
    const mockFeedback = {
      id: `mock-${Date.now()}`,
      customerName: newCustomer.name,
      content: newCustomer.feedback || "Manually added customer",
      rating: newCustomer.rating,
      customerStatus: newCustomer.status,
      createdAt: new Date().toISOString(),
    };
    setFeedbacks([mockFeedback, ...feedbacks]);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-10 animate-in fade-in duration-700">
      
      {/* Premium Top Bar */}
      <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-3 px-6 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3">
           <div className="bg-zinc-800/50 px-4 py-1.5 rounded-xl border border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
           </div>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-zinc-400 text-xs font-bold uppercase tracking-tight">Welcome, <span className="text-white">Anas!</span></span>
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border border-white/20 p-0.5">
              <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden">
                <img src="https://ui-avatars.com/api/?name=Anas&background=random" alt="User" className="w-full h-full object-cover" />
              </div>
           </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="p-3 bg-white/5 backdrop-blur-lg border border-white/10 text-zinc-400 hover:text-white rounded-2xl transition hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
            Customer Management
          </h1>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <input 
              type="text" 
              placeholder="Search Customers" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-3 px-5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition shadow-inner"
            />
            <svg className="absolute right-4 top-3.5 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition flex items-center gap-2 whitespace-nowrap shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Customer
          </button>
        </div>
      </div>


      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Customers Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] space-y-2 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all duration-700"></div>
          <div className="absolute right-6 top-8 text-blue-500/20 group-hover:text-blue-500/40 transition-colors duration-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest relative z-10">Total Customers</p>
          <div className="relative z-10 flex items-baseline gap-2">
            <h3 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 tracking-tighter drop-shadow-[0_0_35px_rgba(59,130,246,0.5)]">
              {feedbacks.length}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 uppercase tracking-tight relative z-10">
            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Real-time tracking
          </div>
        </div>

        {/* Customer Sentiment Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Customer Sentiment</p>
            <div className="text-green-500/20 group-hover:text-green-500/40 transition-colors duration-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
          <div className="relative z-10 w-full mt-auto">
            <CustomerCharts type="pie" data={dynamicStats.pieData} />
          </div>
        </div>

        {/* Avg Feedback Score Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] space-y-4 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-yellow-500/15 rounded-full blur-3xl group-hover:bg-yellow-500/25 transition-all duration-700"></div>
          <div className="absolute right-6 top-8 text-yellow-500/20 group-hover:text-yellow-500/40 transition-colors duration-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest relative z-10">Average Feedback Score</p>
          <div className="space-y-4 relative z-10">
            <div className="flex items-baseline gap-2">
              <h3 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]">{dynamicStats.avgScore}</h3>
              <p className="text-zinc-500 font-black text-2xl">/ 5</p>
            </div>
            <div className="flex gap-1.5">
               {[1, 2, 3, 4, 5].map((s) => (
                 <svg key={s} className={`w-6 h-6 transition-transform hover:scale-125 duration-300 ${s <= Math.round(Number(dynamicStats.avgScore)) ? "text-yellow-500 fill-current drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" : "text-zinc-800 fill-current"}`} viewBox="0 0 20 20">
                   <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                 </svg>
               ))}
            </div>
          </div>
        </div>

        {/* Key Themes Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] space-y-4 overflow-hidden relative shadow-2xl group flex flex-col justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)] animate-pulse"></div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest relative z-10">Key Feedback Themes</p>
          <div className="flex flex-wrap gap-3 items-center justify-center py-4 relative z-10">
             <span className="text-green-400 font-bold text-xl drop-shadow-[0_0_12px_rgba(74,222,128,0.4)] hover:scale-110 transition cursor-default">service</span>
             <span className="text-white text-4xl font-black tracking-tighter drop-shadow-[0_0_18px_rgba(255,255,255,0.3)] hover:scale-110 transition cursor-default">experience</span>
             <span className="text-green-500 text-3xl font-black drop-shadow-[0_0_12px_rgba(34,197,94,0.4)] hover:scale-110 transition cursor-default">quality</span>
             <span className="text-blue-500 text-5xl font-black tracking-tighter italic drop-shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:scale-110 transition cursor-default">customers</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
            <div className="h-full bg-blue-600 w-2/3 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white uppercase tracking-tighter text-lg">Recent Customer Activity</h3>
            <div className="h-px flex-1 bg-white/5 ml-6"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeedbacks.length > 0 ? (
              filteredFeedbacks.map((item) => (
                <div key={item.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-xl hover:bg-white/10 transition group animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden shadow-lg group-hover:border-blue-500/50 transition">
                      <img src={`https://ui-avatars.com/api/?name=${item.customerName || "User"}&background=random`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <h4 className="text-white font-bold text-sm tracking-tight">{item.customerName || "Anonymous"}</h4>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="flex gap-0.5 text-yellow-500">
                        {[1, 2, 3, 4, 5].map(s => (
                          <svg key={s} className={`w-3 h-3 ${s <= item.rating ? "fill-current" : "text-zinc-800 fill-current"}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-zinc-400 text-xs leading-relaxed italic line-clamp-2 overflow-hidden">
                    "{item.content || "No comment provided"}"
                  </p>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                      item.customerStatus === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {item.customerStatus || 'Active'}
                    </span>
                    <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition">View Details</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No customer activity found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white uppercase tracking-tighter text-lg">Feedback Trends</h3>
            <div className="h-px flex-1 bg-white/5 ml-6"></div>
          </div>
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 h-[400px] shadow-2xl relative group overflow-hidden">
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all duration-700"></div>
            <CustomerCharts type="line" data={feedbacks} />
          </div>
        </div>
      </div>


      <AddCustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddCustomer} 
      />
    </div>
  );
}
