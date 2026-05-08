import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const user = await currentUser();
  
  const business = await prisma.business.findFirst({
    where: { userId: user?.id },
    orderBy: { id: "desc" },
    include: {
      qrCodes: {
        include: {
          feedbacks: true
        }
      }
    }
  });

  // Extract clean data for client component
  const userData = {
    firstName: user?.firstName,
    lastName: user?.lastName,
    imageUrl: user?.imageUrl,
    emailAddresses: user?.emailAddresses.map(e => ({ emailAddress: e.emailAddress }))
  };

  const feedbacks = business?.qrCodes.flatMap(qr => qr.feedbacks) || [];

  const businessData = business ? {
    id: business.id,
    name: business.name,
    customers: feedbacks.map(f => ({
      name: f.customerName,
      email: f.customerName ? `${f.customerName.toLowerCase().replace(/\s/g, '.')}@example.com` : 'N/A', // Placeholder email if not available
      rating: f.rating,
      status: f.customerStatus,
      date: f.createdAt.toISOString()
    }))
  } : null;

  return (
    <SettingsClient user={userData} business={businessData} />
  );
}
