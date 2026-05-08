export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingUI from "@/components/LandingUI";

export default async function RootPage() {
  const { userId } = await auth();

  // If user is logged in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  // Otherwise, show the interactive landing page UI
  return <LandingUI />;
}