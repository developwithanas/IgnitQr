"use client";

import { useState } from "react";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: any) => void;
}

export default function AddCustomerModal({ isOpen, onClose, onSave }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rating: 5,
    status: "Active",
    feedback: ""
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-xl bg-[#1a1b23] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
           <h2 className="text-white font-bold text-lg">Add New Customer</h2>
           <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-500">Customer Name</label>
                 <input 
                   required
                   type="text" 
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition" 
                   placeholder="John Doe"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-500">Email Address</label>
                 <input 
                   type="email" 
                   value={formData.email}
                   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                   className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition" 
                   placeholder="john@example.com"
                 />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-500">Initial Rating</label>
                 <select 
                   value={formData.rating}
                   onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                   className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition appearance-none"
                 >
                    {[5, 4, 3, 2, 1].map(r => (
                      <option key={r} value={r}>{r} Stars</option>
                    ))}
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-500">Status</label>
                 <select 
                   value={formData.status}
                   onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                   className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition appearance-none"
                 >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                 </select>
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500">Internal Feedback Note</label>
              <textarea 
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                className="w-full h-24 bg-zinc-900 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition resize-none"
                placeholder="Notes about this customer..."
              ></textarea>
           </div>

           <div className="flex gap-4 pt-4">
              <button 
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-600/20"
              >
                 Add Customer
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition border border-white/5"
              >
                 Cancel
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
