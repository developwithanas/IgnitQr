"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateStore() {
  const [name, setName] = useState("");
  const [googleLink, setGoogleLink] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    const slug = name.toLowerCase().replaceAll(" ", "-");

    const res = await fetch("/api/business", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        googleLink,
        slug,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Store created successfully!");
      setName("");
      setGoogleLink("");
      setIsModalOpen(false);
      router.refresh();
    } else {
      alert(data.error || "Failed to create store");
    }
  };

  return (
    <div className="relative">
      {/* Add Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 bg-blue-600/20 text-blue-500 border border-blue-600/30 px-5 py-2.5 rounded-xl font-bold hover:bg-blue-600/30 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
        Add
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden">
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              setIsModalOpen(true);
            }}
            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Create Store
          </button>
          <button className="w-full text-left px-4 py-3 text-sm text-slate-500 hover:bg-slate-800 flex items-center gap-3 cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Product
          </button>
          <button className="w-full text-left px-4 py-3 text-sm text-slate-500 hover:bg-slate-800 flex items-center gap-3 cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
            Add Collection
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              Create New Store
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Store Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Google Review Link"
                value={googleLink}
                onChange={(e) => setGoogleLink(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleCreate}
                className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-white font-bold transition"
              >
                Create Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}