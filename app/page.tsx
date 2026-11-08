export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingUI from "@/components/LandingUI";

export default async function RootPage() {
  const session = await getSession();

  // If user is logged in, redirect to dashboard
  if (session?.userId) {
    redirect("/dashboard");
  }

  // Otherwise, show the interactive landing page UI
  return <LandingUI />;
}
