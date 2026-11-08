import Link from "next/link";

/** Shared background, logo and card used by the sign-in style pages. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[350px] h-[250px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <Link href="/" className="flex items-center gap-2 mb-8 z-10 group">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-105 transition">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-2xl font-black tracking-tight text-white">Ignite<span className="text-blue-500">QR</span></span>
      </Link>

      <div className="w-full max-w-md bg-zinc-950/80 border border-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl z-10 relative">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
          <p className="text-zinc-400 text-sm mt-1">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export const authInputClass =
  "w-full bg-zinc-900/90 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition";
export const authLabelClass = "block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5";
export const authButtonClass =
  "w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
