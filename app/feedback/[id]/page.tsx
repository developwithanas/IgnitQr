import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getOwnerUsage } from "@/lib/usage";
import FeedbackClient from "./FeedbackClient";

export const dynamic = "force-dynamic";

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch QrCode and the related Business
  const qrCode = await prisma.qrCode.findUnique({
    where: { id },
    include: { business: true },
  });

  if (!qrCode || !qrCode.business) {
    notFound();
  }

  // Free plan monthly limit — when used up, customers are sent straight to Google.
  const usage = await getOwnerUsage(qrCode.business.userId);

  return (
    <FeedbackClient
      qrCodeId={qrCode.id}
      businessName={qrCode.business.name}
      location={qrCode.business.location || "Main Branch"}
      googleLink={qrCode.business.googleLink}
      accepting={usage.acceptingFeedback}
    />
  );
}
