"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function CustomerCharts({ type, data }: { type: "pie" | "line" | "sparkline", data: any }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-44"></div>;
  }

  if (type === "pie") {
    return (
      <div className="w-full relative">
        {/* Glow Portal Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-purple-500/10 blur-xl rounded-full"></div>
        
        <div className="h-44 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={55}
                outerRadius={75}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    className="drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: "rgba(17, 17, 17, 0.8)", backdropFilter: 'blur(10px)', border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "10px" }}
                itemStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5 mt-4 w-full text-[10px] font-black text-zinc-500 uppercase tracking-widest relative z-10">
          {data.map((d: any) => (
             <div key={d.name} className="flex items-center gap-2.5 bg-white/5 border border-white/5 p-1.5 px-3 rounded-lg backdrop-blur-sm">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ background: d.color }}></div>
                <span className="flex-1">{d.name}</span>
                <span className="text-white font-black">({d.value})</span>
             </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "line") {
    const timeline = data.reduce((acc: any, f: any) => {
      const date = new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const lineData = Object.entries(timeline).map(([date, count]) => ({ date, count })).reverse();

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={lineData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <defs>
             <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
             </filter>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#52525b", fontSize: 10, fontWeight: 900 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#52525b", fontSize: 10, fontWeight: 900 }} 
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ background: "rgba(17, 17, 17, 0.9)", backdropFilter: 'blur(20px)', border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", fontSize: "12px", boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
            itemStyle={{ color: "#fff", fontWeight: 'bold' }}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#3b82f6" 
            strokeWidth={4} 
            dot={{ fill: "#3b82f6", stroke: "#fff", strokeWidth: 2, r: 5, filter: 'url(#glow)' }}
            activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
            animationDuration={2000}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
