import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    // 1. Extract Identity
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Request Body (Google Maps link add kiya yahan)
    const { name, description, googleMaps } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // 3. Save to Supabase
    const newBusiness = await prisma.business.create({
      data: {
        name,
        googleLink: googleMaps || "", // Map googleMaps to googleLink
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7), // generate slug
        userId,
        qrCodes: {
          create: {} // Ye wahi purana logic jo aapne image mein dikhaya
        }
      },
      include: {
        qrCodes: true
      }
    });

    // 4. Feedback URL generate karo
    const businessId = newBusiness.qrCodes[0].id;
    const feedbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feedback/${businessId}`;

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