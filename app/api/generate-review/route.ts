export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getOwnerUsage, locationLimitMessage } from "@/lib/usage";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const userId = session?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Plan limit: number of business locations
    const usage = await getOwnerUsage(userId);
    if (!usage.canAddLocation) {
      return NextResponse.json({ code: "limit_reached", error: locationLimitMessage(usage) }, { status: 403 });
    }

    const { name, googleMaps } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newBusiness = await prisma.business.create({
      data: {
        name,
        googleLink: googleMaps || "",
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7),
        userId,
        qrCodes: {
          create: {}
        }
      },
      include: {
        qrCodes: true
      }
    });

    const qrCodeId = newBusiness.qrCodes[0].id;
    const feedbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/feedback/${qrCodeId}`;

    return NextResponse.json({
      success: true,
      businessId: newBusiness.id,
      feedbackUrl
    });

  } catch (error) {
    console.error("CREATE_BUSINESS_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 500 }
    );
  }
}
