"use client";

import { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Feedback {
  id: string;
  rating: number;
  createdAt: Date | string;
}

export default function VisualAnalytics({ feedbacks }: { feedbacks: Feedback[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Process real feedback data for the last 30 days
  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];

    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toDateString();
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const count = feedbacks.filter(f => {
        const feedbackDate = new Date(f.createdAt);
        return feedbackDate.toDateString() === dateKey;
      }).length;

      data.push({ day: label, v: count });
    }
    return data;
  }, [feedbacks]);

  if (!mounted) {
    return <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 h-[400px]"></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 animate-in fade-in duration-700">
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-all duration-700"></div>
        
        <h3 className="text-white font-black uppercase tracking-tighter text-lg mb-6 relative z-10">Review Trends</h3>
        
        <div className="h-[300px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="day" 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                fontWeight={900}
                dy={10}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                fontWeight={900}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ background: "rgba(17, 17, 17, 0.9)", backdropFilter: 'blur(20px)', border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", fontSize: "12px", boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: "#fff", fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="v" 
                stroke="#3b82f6" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorV)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-all duration-700"></div>
        
        <h3 className="text-white font-black uppercase tracking-tighter text-lg mb-8 relative z-10">Rating Distribution</h3>
        
        <div className="space-y-6 relative z-10">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = feedbacks.filter(f => f.rating === star).length;
            const pct = feedbacks.length ? (count / feedbacks.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-4 group/item">
                <span className="text-[10px] font-black text-zinc-500 w-4 group-hover/item:text-white transition-colors">{star} ★</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-orange-500 transition-all duration-1000 shadow-[0_0_15px_rgba(249,115,22,0.4)]" style={{ width: `${pct || 5}%` }}></div>
                </div>
                <span className="text-[10px] font-black text-zinc-400 w-8 text-right group-hover/item:text-white transition-colors">{Math.round(pct)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}