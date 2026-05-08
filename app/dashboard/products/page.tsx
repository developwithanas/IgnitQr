export const dynamic = "force-dynamic";
export default function ProductsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-purple-600/10 rounded-full flex items-center justify-center border border-purple-600/20">
        <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
      </div>
      <h1 className="text-3xl font-black text-white">Product Management</h1>
      <p className="text-zinc-500 max-w-md mx-auto">Track and manage the products or services linked to your QR codes. This module is under construction.</p>
      <div className="pt-4">
        <span className="bg-purple-600/20 text-purple-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-purple-600/20">Coming Soon</span>
      </div>
    </div>
  );
}
