export default function AnalysisPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-600/20">
        <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
      </div>
      <h1 className="text-3xl font-black text-white">Feedback Analysis</h1>
      <p className="text-zinc-500 max-w-md mx-auto">Deep dive into your customer sentiment and trends. This feature is currently being calibrated for your data.</p>
      <div className="pt-4">
        <span className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-blue-600/20">Coming Soon</span>
      </div>
    </div>
  );
}
