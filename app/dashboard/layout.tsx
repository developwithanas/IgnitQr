export const dynamic = "force-dynamic";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-300">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-x-hidden flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-[#111111] sticky top-0 z-[50]">
          <div className="flex items-center gap-4">
            <MobileNav />
            <div className="text-zinc-400 text-[10px] font-black uppercase tracking-widest hidden md:block">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-zinc-300 text-sm font-black hidden sm:block">
              Welcome, <span className="text-white">{user?.firstName || "User"}</span>!
            </div>
            <UserButton appearance={{}} />          </div>
        </header>


        {/* Page Content */}
        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}