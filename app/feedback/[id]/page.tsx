import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import FeedbackClient from "./FeedbackClient";

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

  return (
    <FeedbackClient 
      qrCodeId={qrCode.id}
      businessName={qrCode.business.name} 
      location={qrCode.business.location || "Main Branch"}
      googleLink={qrCode.business.googleLink} 
    />
  );
}