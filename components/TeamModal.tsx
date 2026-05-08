"use client";

import { useState } from "react";

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
}



export default function TeamModal({ isOpen, onClose, businessName }: TeamModalProps) {
  const [members, setMembers] = useState([
    { name: "David L.", email: "David.L@igniteqr.co", title: "Admin", status: "Active", img: "https://i.pravatar.cc/150?u=david" },
    { name: "Sara M.", email: "Sara.M@igniteqr.co", title: "Member", status: "Active", img: "https://i.pravatar.cc/150?u=sara" },
    { name: "Sana A.", email: "Sana.A@igniteqr.co", title: "Member", status: "Active", img: "https://i.pravatar.cc/150?u=sana" },
    { name: "Alex T.", email: "Alex.T@igniteqr.co", title: "Member", status: "Active", img: "https://i.pravatar.cc/150?u=alex" },
    { name: "Maria K.", email: "Maria.K@igniteqr.co", title: "Member", status: "Awaiting Activation", img: "https://i.pravatar.cc/150?u=maria" }
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", email: "", title: "Member", status: "Active" });

  const handleRemove = (email: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      setMembers(members.filter(m => m.email !== email));
    }
  };

  const handleChangeRole = (email: string) => {
    setMembers(members.map(m => {
      if (m.email === email) {
        return { ...m, title: m.title === "Admin" ? "Member" : "Admin" };
      }
      return m;
    }));
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({ name: member.name, email: member.email, title: member.title, status: member.status });
    setIsAdding(true);
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setFormData({ name: "", email: "", title: "Member", status: "Active" });
    setIsAdding(true);
  };

  const handleSaveMember = () => {
    if (!formData.name || !formData.email) return alert("Name and Email are required");

    if (editingMember) {
      setMembers(members.map(m => m.email === editingMember.email ? { ...m, ...formData } : m));
    } else {
      setMembers([...members, { ...formData, img: `https://i.pravatar.cc/150?u=${formData.name}` }]);
    }
    setIsAdding(false);
    setEditingMember(null);
  };

  if (!isOpen) return null;

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
           <h2 className="text-white font-bold text-lg">
              Organization Management - <span className="text-white/60">Team Profile</span>
           </h2>
           <button 
             onClick={onClose}
             className="text-zinc-500 hover:text-white transition"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
        </div>

        {/* Tabs - Removed Departments and Access Roles as requested */}
        <div className="px-6 pt-4 border-b border-white/5 flex gap-8">
             <div className="pb-4 text-xs font-black uppercase tracking-widest text-blue-500 relative">
               Team Members
               <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
             </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
           <>
               {isAdding ? (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-6">
                       <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white transition p-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                       </button>
                       <h3 className="text-white font-bold">{editingMember ? "Edit Team Member" : "Add New Team Member"}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-500">Full Name</label>
                          <input 
                            type="text" 
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition" 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-500">Email Address</label>
                          <input 
                            type="email" 
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition" 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-500">Role</label>
                          <select 
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition appearance-none"
                          >
                             <option value="Member">Member</option>
                             <option value="Admin">Admin</option>
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
                             <option value="Awaiting Activation">Awaiting Activation</option>
                          </select>
                       </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                       <button 
                         onClick={handleSaveMember}
                         className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition shadow-blue-600/20"
                       >
                          {editingMember ? "Update Member" : "Create Member"}
                       </button>
                       <button 
                         onClick={() => setIsAdding(false)}
                         className="text-zinc-500 hover:text-white font-bold text-sm px-6"
                       >
                          Cancel
                       </button>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b border-white/5">
                                <th className="pb-4">Profile Photo</th>
                                <th className="pb-4">Email</th>
                                <th className="pb-4">Title</th>
                                <th className="pb-4">Status</th>
                                <th className="pb-4">Actions</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                             {members.map((member) => (
                               <tr key={member.email} className="group hover:bg-white/5 transition-colors">
                                  <td className="py-4">
                                     <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                                           <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-xs font-bold text-white">{member.name}</span>
                                     </div>
                                  </td>
                                  <td className="py-4 text-xs font-medium text-zinc-400">{member.email}</td>
                                  <td className="py-4 text-xs font-bold text-zinc-300">{member.title}</td>
                                  <td className="py-4">
                                     <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${
                                       member.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                     }`}>
                                        {member.status}
                                     </span>
                                  </td>
                                  <td className="py-4">
                                     <div className="flex items-center gap-3 text-[10px] font-black uppercase">
                                        <button 
                                          onClick={() => handleEdit(member)}
                                          className="text-blue-500 hover:underline transition"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          onClick={() => handleChangeRole(member.email)}
                                          className="text-blue-500 hover:underline transition"
                                        >
                                          Change Role
                                        </button>
                                        <button 
                                          onClick={() => handleRemove(member.email)}
                                          className="text-red-500/60 hover:text-red-500 transition"
                                        >
                                          Remove
                                        </button>
                                     </div>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                       <button 
                         onClick={handleAddNew}
                         className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition shadow-lg shadow-blue-600/20"
                       >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                          Add New Team Member
                       </button>
                       <div className="flex items-center gap-4">
                          <p className="text-[10px] font-black text-zinc-500 uppercase">1-{members.length} of {members.length} Team Members</p>
                          <div className="flex gap-1">
                             <button className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500 cursor-not-allowed border border-white/5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                             </button>
                             <button className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500 cursor-not-allowed border border-white/5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
           <div>Total Members: <span className="text-white">{members.length}</span></div>
           <div>Organization: <span className="text-white">{businessName}</span></div>
           <div>Member Limit: <span className="text-white">50</span></div>
        </div>
      </div>
    </div>
  );
}
