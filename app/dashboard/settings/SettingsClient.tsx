"use client";

import { useState } from "react";
import Image from "next/image";
import EditProfileModal from "@/components/EditProfileModal";
import PlansModal from "@/components/PlansModal";

type Billing = {
  plan: string;
  priceInr: number;
  expiresAt: string | null;
  paymentMethod: string | null;
  pendingPlan: string | null;
};

export default function SettingsClient({ user, business, billing }: { user: any, business: any, billing: Billing }) {
  const planLabel = `${billing.plan} Plan`;
  const priceLabel = billing.priceInr > 0 ? `₹${billing.priceInr}/mo` : "Free";
  const expiryLabel = billing.expiresAt
    ? new Date(billing.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    if (confirm("To permanently delete your account data, send us a request through the Contact form. Open it now?")) {
      window.location.href = "/#contact";
    }
  };

  const ownerName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Account Owner";
  const ownerEmail = user?.emailAddresses?.[0]?.emailAddress || "";
  const avatarFor = (seed: string) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || "User")}`;

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
                src={user?.imageUrl || avatarFor(user?.firstName)}
                alt="Profile" 
                unoptimized
                width={64} 
                height={64} 
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-500 font-bold uppercase">Profile Info: <span className="text-white">{ownerName}</span></p>
              <p className="text-xs text-zinc-500 font-bold uppercase">Email: <span className="text-white lowercase">{ownerEmail || "—"}</span></p>
              <p className="text-xs text-zinc-500 font-bold uppercase">Company: <span className="text-white">{business?.name || "Not set up yet"}</span></p>
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
            <p className="text-xs font-bold text-zinc-400">Subscription: <span className="text-white">{planLabel}</span> <span className="text-green-500">(Active)</span>{billing.pendingPlan && <span className="text-amber-500"> · {billing.pendingPlan} payment under review</span>}</p>
          </div>
        </div>

        {/* Organization */}
        <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest">Organization</h2>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-500">Coming soon</span>
          </div>
          <p className="text-xs font-bold text-zinc-400">Team Management (1 member)</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700">
                  <img src={user?.imageUrl || avatarFor(user?.firstName)} alt={ownerName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{ownerName}</p>
                  <p className="text-[10px] font-medium text-zinc-500">Owner{ownerEmail ? ` · ${ownerEmail}` : ""}</p>
                </div>
              </div>
            </div>
          </div>
          <button
            disabled
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Team invites coming soon
          </button>
        </div>

        {/* Integrations */}
        <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest">Integrations</h2>
          <div className="space-y-4">
            {[
              business?.googleLink
                ? { name: "Google Review Link", status: "Connected", color: "text-green-500" }
                : { name: "Google Review Link", status: "Not set", color: "text-amber-500" },
              { name: "Shopify", status: "Coming soon", color: "text-zinc-500" },
              { name: "Salesforce", status: "Coming soon", color: "text-zinc-500" }
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
          <button disabled className="w-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold py-2 rounded-xl text-sm cursor-not-allowed">
            More integrations coming soon
          </button>
        </div>

        {/* Billing & Plans */}
        <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest">Billing & Plans</h2>
          <div className="space-y-1">
            <p className="text-xs font-bold text-zinc-400">Billing Summary</p>
            <div className="grid grid-cols-2 gap-y-2 pt-2 text-[11px] font-bold">
              <span className="text-zinc-500 uppercase">Current Plan:</span>
              <span className="text-white">{billing.plan} ({priceLabel})</span>
              <span className="text-zinc-500 uppercase">Payment Method:</span>
              <span className="text-white">{billing.paymentMethod || "—"}</span>
              <span className="text-zinc-500 uppercase">Valid Until:</span>
              <span className="text-white">{expiryLabel}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400">Usage</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "QR Codes", value: business?.qrCount ?? 0 },
                { label: "Scans", value: business?.totalScans ?? 0 },
                { label: "Reviews", value: business?.reviewCount ?? 0 },
              ].map((stat) => (
                <div key={stat.label} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-2 text-center">
                  <p className="text-lg font-black text-white">{stat.value}</p>
                  <p className="text-[10px] font-black text-zinc-500 uppercase">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
             <button 
               onClick={() => setIsPlansModalOpen(true)}
               className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition text-sm shadow-lg shadow-blue-600/20"
             >
                {billing.plan === "Starter" ? "Upgrade Plan" : "Renew / Change Plan"}
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
                Request data deletion
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
               <span className="text-xs font-bold text-zinc-500 uppercase">Password Login: <span className="text-green-500">Active</span></span>
               <span className="text-zinc-600 text-[11px] font-bold">Encrypted</span>
            </div>
            <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-zinc-500 uppercase">2-Factor Authentication</span>
               <span className="text-amber-500 text-[10px] font-black uppercase">Coming soon</span>
            </div>
            <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-zinc-500 uppercase">API Access</span>
               <span className="text-zinc-500 text-[10px] font-black uppercase">Enterprise plan</span>
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest">Notifications</h2>
            <p className="text-xs font-bold text-zinc-400">Notification Preferences <span className="text-amber-500 text-[10px] font-black uppercase ml-1">Coming soon</span></p>
            <div className="space-y-3 opacity-60">
               {["Email Digest (Daily)", "Critical Alerts (Push)", "New Review (Email)"].map(opt => (
                 <label key={opt} className="flex items-center gap-3 cursor-not-allowed group">
                    <input type="checkbox" disabled className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-blue-600 focus:ring-0 focus:ring-offset-0 transition" />
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
        user={{ ...user, planLabel }}
        business={business}
      />

      <PlansModal 
        isOpen={isPlansModalOpen} 
        onClose={() => setIsPlansModalOpen(false)} 
        currentPlan={billing.plan}
      />
    </div>
  );
}
