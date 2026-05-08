"use client";

import { useState } from "react";
import Image from "next/image";
import EditProfileModal from "@/components/EditProfileModal";
import TeamModal from "@/components/TeamModal";
import PlansModal from "@/components/PlansModal";

export default function SettingsClient({ user, business }: { user: any, business: any }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);

  const handleExportData = () => {
    if (!business?.customers || business.customers.length === 0) {
      alert("No customer data available to export.");
      return;
    }

    // Define CSV header
    const headers = ["Customer Name", "Email", "Rating", "Status", "Date"];
    
    // Convert data to CSV rows
    const rows = business.customers.map((c: any) => [
      c.name || "Anonymous",
      c.email,
      c.rating,
      c.status || "Active",
      new Date(c.date).toLocaleDateString()
    ]);

    // Create CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((r: any) => r.join(","))
    ].join("\n");

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `igniteqr_customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert("Export successful! Your CSV file has been generated.");
  };

  const handleDeleteData = () => {
    if (confirm("WARNING: This will permanently delete all customer and review data associated with your account. This action cannot be undone. Are you absolutely sure?")) {
      alert("System initiated data purge. This would normally clear your database records.");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-10 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Account & Profile */}
        <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest">Account & Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-800">
              <Image 
                src={user?.imageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Anas"} 
                alt="Profile" 
                width={64} 
                height={64} 
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-500 font-bold uppercase">Profile Info: <span className="text-white">{user?.firstName || "Anas"} {user?.lastName || "Q."}</span></p>
              <p className="text-xs text-zinc-500 font-bold uppercase">Email: <span className="text-white lowercase">{user?.emailAddresses[0]?.emailAddress || "anas.q@igniteqr.co"}</span></p>
              <p className="text-xs text-zinc-500 font-bold uppercase">Company: <span className="text-white">{business?.name || "IgniteQR"}</span></p>
            </div>
          </div>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white font-bold py-2 rounded-xl hover:bg-zinc-800 transition text-sm"
          >
            Edit Profile
          </button>
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-xs font-bold text-zinc-400">Subscription: <span className="text-white">IgniteQR Pro Plan</span> <span className="text-green-500">(Active)</span></p>
          </div>
        </div>

        {/* Organization */}
        <div 
          onClick={() => setIsTeamModalOpen(true)}
          className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-6 cursor-pointer hover:border-zinc-700 transition group"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest group-hover:text-white transition">Organization</h2>
            <div className="text-zinc-500 group-hover:text-white">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </div>
          </div>
          <p className="text-xs font-bold text-zinc-400">Team Management (5 members)</p>
          <div className="space-y-3">
            {[
              { name: "David L.", role: "Admin", img: "https://i.pravatar.cc/150?u=david" },
              { name: "Sara M.", role: "Member", img: "https://i.pravatar.cc/150?u=sara" },
              { name: "Sana A.", role: "Member", img: "https://i.pravatar.cc/150?u=sana" }
            ].map((member) => (
              <div key={member.name} className="flex items-center justify-between p-2 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700">
                    <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{member.name}</p>
                    <p className="text-[10px] font-medium text-zinc-500">{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={(e) => {
               e.stopPropagation();
               setIsTeamModalOpen(true);
            }}
            className="w-full bg-zinc-900 border border-zinc-800 text-white font-bold py-2 rounded-xl hover:bg-zinc-800 transition text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Member
          </button>
        </div>

        {/* Integrations */}
        <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest">Integrations</h2>
          <div className="space-y-4">
            {[
              { name: "Google Business Profile", platform: "Google", status: "Connected", color: "text-green-500" },
              { name: "Shopify", platform: "Shopify", status: "Connected", color: "text-green-500" },
              { name: "Salesforce", platform: "Salesforce", status: "Disconnected", color: "text-zinc-500" }
            ].map((integ) => (
              <div key={integ.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                   </div>
                   <p className="text-xs font-bold text-white">{integ.name}</p>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 ${integ.color}`}>
                  {integ.status}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full bg-zinc-900 border border-zinc-800 text-white font-bold py-2 rounded-xl hover:bg-zinc-800 transition text-sm">
            Manage Integrations
          </button>
        </div>

        {/* Billing & Plans */}
        <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest">Billing & Plans</h2>
          <div className="space-y-1">
            <p className="text-xs font-bold text-zinc-400">Billing Summary</p>
            <div className="grid grid-cols-2 gap-y-2 pt-2 text-[11px] font-bold">
              <span className="text-zinc-500 uppercase">Current Plan:</span>
              <span className="text-white">IgniteQR Pro Plan ($49/mo)</span>
              <span className="text-zinc-500 uppercase">Payment Method:</span>
              <span className="text-white">Visa ending 4321</span>
              <span className="text-zinc-500 uppercase">Next Billing Date:</span>
              <span className="text-white">June 8, 2026</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400">Usage Limits</p>
            <div className="flex gap-1 h-8 items-end">
               <div className="flex-1 bg-zinc-800 h-1/4 rounded-sm"></div>
               <div className="flex-1 bg-zinc-800 h-2/4 rounded-sm"></div>
               <div className="flex-1 bg-blue-600 h-full rounded-sm shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
               <div className="flex-1 bg-green-500 h-3/4 rounded-sm shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            </div>
            <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase">
               <span>API Calls (75% utilized)</span>
               <span>Storage (20% utilized)</span>
            </div>
          </div>

          <div className="flex gap-3">
             <button 
               onClick={() => setIsPlansModalOpen(true)}
               className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition text-sm shadow-lg shadow-blue-600/20"
             >
                Update Billing
             </button>
             <button 
               onClick={() => setIsPlansModalOpen(true)}
               className="flex-1 bg-zinc-900 border border-zinc-800 text-white font-bold py-2 rounded-xl hover:bg-zinc-800 transition text-sm"
             >
                View All Plans
             </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest">Data Management</h2>
          <p className="text-xs font-bold text-zinc-400">Data & Privacy</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase">Data Export:</span>
              <button 
                onClick={handleExportData}
                className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-white text-[10px] font-black uppercase hover:bg-zinc-800 transition"
              >
                Export all customer data (CSV)
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase">Data Deletion:</span>
              <button 
                onClick={handleDeleteData}
                className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-red-500 text-[10px] font-black uppercase hover:bg-red-500/20 transition"
              >
                Delete all data (Irreversible)
              </button>
            </div>
          </div>
        </div>

        {/* Security & API */}
        <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest">Security & API</h2>
          <p className="text-xs font-bold text-zinc-400">Security Settings</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-zinc-500 uppercase">2-Factor Authentication: <span className="text-green-500">Enabled</span></span>
               <button className="text-blue-500 text-[11px] font-bold hover:underline">Edit</button>
            </div>
            <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-zinc-500 uppercase">API Keys: <span className="text-white">3 active keys</span></span>
               <button className="text-blue-500 text-[11px] font-bold hover:underline">View Keys</button>
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest">Notifications</h2>
            <p className="text-xs font-bold text-zinc-400">Notification Preferences</p>
            <div className="space-y-3">
               {["Email Digest (Daily)", "Critical Alerts (Push)", "New Review (Email)"].map(opt => (
                 <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-blue-600 focus:ring-0 focus:ring-offset-0 transition" defaultChecked={opt.includes("Email")} />
                    <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition">{opt}</span>
                 </label>
               ))}
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={user}
        business={business}
      />

      <TeamModal 
        isOpen={isTeamModalOpen} 
        onClose={() => setIsTeamModalOpen(false)} 
        businessName={business?.name || "IgniteQR"}
      />

      <PlansModal 
        isOpen={isPlansModalOpen} 
        onClose={() => setIsPlansModalOpen(false)} 
      />
    </div>
  );
}
