"use client";

import { useState } from "react";
import Image from "next/image";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  business: any;
}

export default function EditProfileModal({ isOpen, onClose, user, business }: EditProfileModalProps) {
  const [companyName, setCompanyName] = useState(business?.name || "");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: business?.id, name: companyName }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload(); // Refresh to show changes
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-[#1a1b23] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                <img src={user?.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
             </div>
             <h2 className="text-white font-bold text-lg">
                {user?.firstName} {user?.lastName} <span className="text-white/40 font-medium">/ Edit Profile</span>
             </h2>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={handleSave}
               disabled={isLoading}
               className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isLoading ? "Saving..." : "Save Changes"}
             </button>
             <button 
               onClick={onClose}
               className="text-zinc-500 hover:text-white transition text-sm font-bold"
             >
               Cancel
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Left Column */}
          <div className="space-y-8">
            {/* Profile Picture */}
            <div className="space-y-4">
              <p className="text-xs font-black uppercase text-zinc-500 tracking-widest">Profile Picture</p>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-800 relative group">
                  <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-600">First Name</label>
                      <input type="text" defaultValue={user?.firstName} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-600">Last Name</label>
                      <input type="text" defaultValue={user?.lastName} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600" />
                   </div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
               <label className="text-xs font-black uppercase text-zinc-500 tracking-widest">Email</label>
               <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-zinc-500 group-focus-within:text-white transition">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                  <input type="email" defaultValue={user?.emailAddresses[0]?.emailAddress} className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-11 pr-32 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition" />
                  <button className="absolute right-2 top-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-white/5 transition">
                     Verify Email
                  </button>
               </div>
            </div>

            {/* Company / Store */}
            <div className="space-y-4">
               <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-zinc-500 tracking-widest">Company</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-4 flex items-center text-zinc-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                     </div>
                     <input 
                        type="text" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-11 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition" 
                     />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-600">Store Type</label>
                  <input type="text" placeholder="E.g. Retail, Restaurant" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-zinc-600">Location</label>
                     <select className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition appearance-none">
                        <option>Select Country</option>
                        <option selected>United States</option>
                        <option>India</option>
                        <option>United Kingdom</option>
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-zinc-600">Job Title</label>
                     <select className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition appearance-none">
                        <option selected>Business Owner</option>
                        <option>Manager</option>
                        <option>Marketing Lead</option>
                     </select>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8 flex flex-col">
            <div className="space-y-2 flex-1">
               <label className="text-xs font-black uppercase text-zinc-500 tracking-widest">Bio</label>
               <textarea 
                 placeholder="Short Description for here..." 
                 className="w-full h-40 bg-zinc-900 border border-white/10 rounded-[1.5rem] p-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition resize-none"
               ></textarea>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
               <label className="text-xs font-black uppercase text-zinc-500 tracking-widest block">Subscription</label>
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-zinc-800 flex items-center justify-center">
                     <img src={user?.imageUrl} alt="User" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-bold text-zinc-400">Subscription Plan: <span className="text-white">IgniteQR Pro Plan</span> <span className="text-green-500 font-black">(Active)</span></p>
               </div>
               <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase py-3 rounded-xl transition border border-white/5">
                  Manage Plan
               </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-center gap-4 bg-white/5">
           <button 
             onClick={handleSave}
             disabled={isLoading}
             className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl text-sm font-bold shadow-lg transition shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
           >
              {isLoading ? "Saving..." : "Save Changes"}
           </button>
           <button 
             onClick={onClose}
             className="text-zinc-500 hover:text-white transition text-sm font-bold px-4"
           >
             Cancel
           </button>
        </div>
      </div>
    </div>
  );
}
