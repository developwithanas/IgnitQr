"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";

const PaymentModal = dynamic(() => import("./PaymentModal"), { ssr: false });

export default function LandingUI() {

  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: "", price: "" });

  const openPaymentModal = (name: string, price: string) => {
    setSelectedPlan({ name, price });
    setIsPaymentModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  return (

    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-amber-500/30 overflow-x-hidden tracking-tight">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-amber-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/5 rounded-full blur-[120px]"></div>
        <img 
          src="/igniteqr_hero_background_1778222850014.png" 
          alt="Background" 
          className="w-full h-full object-cover opacity-30 mix-blend-lighten"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/40 via-[#09090b]/80 to-[#09090b]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-8 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-all duration-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-6 h-6 text-black">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">IgniteQR</span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-[13px] font-black uppercase tracking-[0.2em] text-zinc-500">
          <button 
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-amber-500 transition-colors"
          >
            How it works
          </button>
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-amber-500 transition-colors"
          >
            Pricing
          </button>
        </div>


        <div className="flex items-center gap-3">
          <SignInButton mode="modal"><button className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition">Login</button></SignInButton>
          <SignUpButton mode="modal"><button className="bg-white text-black px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition hover:scale-105 active:scale-95 shadow-xl">Sign Up</button></SignUpButton>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-32 md:pt-48 pb-32">
        <div className="text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Next-Gen Feedback Platform
          </div>
          
          <h1 className="text-7xl md:text-[120px] font-black tracking-tighter leading-[0.85] text-white">
            QR Codes that <br />
            <span className="text-amber-500 drop-shadow-[0_0_50px_rgba(245,158,11,0.2)]">just work.</span>
          </h1>
          
          <p className="text-xl text-zinc-500 font-medium leading-relaxed max-w-2xl mx-auto">
            Connect all your tools from a single platform. Built for teams that need efficiency, not complexity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto bg-amber-500 text-black px-12 py-5 rounded-full text-sm font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(245,158,11,0.2)] hover:shadow-[0_20px_60px_rgba(245,158,11,0.4)] hover:scale-105 transition-all duration-300"
            >
              Get Started Free
            </Link>
            
            <button 
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 px-12 py-5 rounded-full text-sm font-black uppercase tracking-widest transition-all backdrop-blur-md"
            >
              See the magic
            </button>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-40 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-24">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-amber-500 text-[11px] font-black uppercase tracking-[0.4em]">The Workflow</h2>
            <h3 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">Simplicity <br /> in Every Scan.</h3>
          </div>
          <p className="text-zinc-500 font-medium max-w-xs pb-2">We've automated the entire feedback loop so you can focus on what matters: your customers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { id: '01', title: 'Get Your QR', desc: 'Generate your professional QR code instantly.', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01' },
            { id: '02', title: 'Scan', desc: 'Customers scan at your location to share feedback.', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5' },
            { id: '03', title: 'AI Assist', desc: 'Our AI helps customers write glowing reviews.', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636' },
            { id: '04', title: 'Analytics', desc: 'Track all customer trends in one dashboard.', icon: 'M9 19v-6a2 2 0 00-2-2H5' },
            { id: '05', title: 'Improve', desc: 'Use AI insights to get more 5-star ratings.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
          ].map((step, idx) => (
            <div key={step.id} className="bg-[#111113] border border-white/5 p-8 rounded-[2.5rem] space-y-6 group hover:border-amber-500/30 transition-all duration-500">
              <div className="text-amber-500/20 font-black text-3xl group-hover:text-amber-500 transition-colors">{step.id}.</div>
              <h4 className="text-white font-black uppercase tracking-tighter text-lg leading-none">{step.title}</h4>
              <p className="text-zinc-500 text-xs font-medium leading-relaxed">{step.desc}</p>
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-amber-500 group-hover:border-amber-500/20 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={step.icon}></path></svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-40 bg-zinc-950/50 backdrop-blur-3xl rounded-[4rem] border border-white/5">
        <div className="text-center space-y-4 mb-24">
          <h2 className="text-amber-500 text-[11px] font-black uppercase tracking-[0.4em]">Pricing</h2>
          <h3 className="text-5xl md:text-7xl font-black tracking-tighter text-white">One Plan. <span className="text-amber-500">Infinite Potential.</span></h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="p-10 rounded-[3rem] border border-white/5 space-y-8 hover:bg-white/[0.02] transition">
            <div className="space-y-1">
              <h4 className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Starter</h4>
              <h3 className="text-5xl font-black tracking-tighter text-white">Free</h3>
            </div>
            <ul className="space-y-4 text-zinc-500 text-sm font-medium">
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 5 QR Codes</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 50 Scans / mo</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Basic Analytics</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Community Support</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Mobile App Access</li>
            </ul>
            <button 
              onClick={() => openPaymentModal("Starter", "Free")}
              className="w-full py-4 rounded-full border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition"
            >
              Get Started
            </button>
          </div>

          {/* Pro */}
          <div className="p-10 rounded-[3rem] bg-white text-black space-y-8 transform md:scale-110 shadow-2xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Most Popular</div>
            <div className="space-y-1">
              <h4 className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Professional</h4>
              <h3 className="text-6xl font-black tracking-tighter">₹1499<span className="text-zinc-400 text-xl">/mo</span></h3>
            </div>
            <ul className="space-y-4 text-zinc-900 text-sm font-bold">
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Unlimited QR Codes</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> AI Review Engine</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Custom Branding</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Advanced Dashboard</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Priority Support</li>
            </ul>
            <button 
              onClick={() => openPaymentModal("Professional", "₹1499/mo")}
              className="w-full py-5 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-xl"
            >
              Ignite Now
            </button>
          </div>

          {/* Enterprise */}
          <div className="p-10 rounded-[3rem] border border-white/5 space-y-8 hover:bg-white/[0.02] transition">
            <div className="space-y-1">
              <h4 className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Enterprise</h4>
              <h3 className="text-5xl font-black tracking-tighter text-white">₹4999</h3>
            </div>
            <ul className="space-y-4 text-zinc-500 text-sm font-medium">
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Unlimited Locations</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Dedicated Manager</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> API Access</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> SLA Guarantee</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Custom Integrations</li>
            </ul>
            <button 
              onClick={() => openPaymentModal("Enterprise", "₹4999/mo")}
              className="w-full py-4 rounded-full border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition"
            >
              Contact Sales
            </button>

          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 max-w-4xl mx-auto px-6 py-40">
        <div className="bg-[#111113] border border-white/5 rounded-[4rem] p-12 md:p-20 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-amber-500 text-[11px] font-black uppercase tracking-[0.4em]">Get In Touch</h2>
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white">Let's Ignite Your <br /> Business Together.</h3>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Full Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe" 
                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-amber-500/50 transition" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Email Address</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com" 
                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-amber-500/50 transition" 
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Your Message</label>
              <textarea 
                required
                rows={4} 
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="How can we help you?" 
                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-amber-500/50 transition resize-none"
              ></textarea>
            </div>
            <button 
              disabled={status === "loading"}
              type="submit" 
              className={`md:col-span-2 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-2xl ${
                status === "success" ? "bg-green-500 text-white" : 
                status === "error" ? "bg-red-500 text-white" : 
                "bg-white text-black hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {status === "loading" ? "Sending..." : 
               status === "success" ? "Message Sent!" : 
               status === "error" ? "Error! Try Again" : 
               "Send Message"}
            </button>
          </form>

        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative z-10 py-24 border-t border-white/5 bg-black/20 backdrop-blur-3xl mt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-6 h-6 text-black">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-2xl font-black tracking-tighter text-white">IgniteQR</span>
              </div>
              <p className="text-zinc-500 text-sm max-w-xs leading-relaxed font-medium italic">
                Empowering the next generation of physical-to-digital interactions with precision and style.
              </p>
                     {/* Social Icons */}
              <div className="flex gap-5">
                {[
                  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/developwithanas/', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                  { name: 'Instagram', url: 'https://www.instagram.com/anas_saifi11/', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                  { name: 'GitHub', url: 'https://github.com/developwithanas', icon: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' },
                  { name: 'Twitter', url: '#', icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' },
                ].map((social) => (
                  <a 
                    key={social.name}
                    href={social.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.name}
                    className="w-12 h-12 rounded-2xl border border-white/5 flex items-center justify-center text-zinc-500 hover:text-amber-500 hover:border-amber-500/20 transition-all hover:bg-amber-500/5 group relative z-50"
                  >
                    <svg className="w-5 h-5 fill-current pointer-events-none" viewBox="0 0 24 24">
                      <path d={social.icon} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h4 className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Navigate</h4>
              <ul className="space-y-4 text-zinc-500 text-[11px] font-bold uppercase tracking-widest">
                <li><a href="#features" className="hover:text-white transition-colors">Platform Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Business Pricing</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Get in Touch</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Legal</h4>
              <ul className="space-y-4 text-zinc-500 text-[11px] font-bold uppercase tracking-widest">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
              © 2026 IgniteQR Global. All Rights Reserved.
            </p>
            
            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 group hover:border-amber-500/20 transition-all duration-500">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Crafted with ❤️ by</span>
              <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] group-hover:tracking-[0.6em] transition-all duration-700">Anas</span>
            </div>
          </div>
        </div>
      </footer>


      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        planName={selectedPlan.name}
        planPrice={selectedPlan.price}
      />
    </div>
  );
}

