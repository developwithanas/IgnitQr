import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { rating, qrCodeId } = await req.json();

    if (!rating || !qrCodeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // First, increment scans on the QrCode
    await prisma.qrCode.update({
      where: { id: qrCodeId },
      data: { scans: { increment: 1 } }
    });

    // Create the feedback record
    const newFeedback = await prisma.feedback.create({
      data: {
        rating,
        qrCodeId,
      },
    });

    return NextResponse.json({ success: true, feedback: newFeedback });
  } catch (error) {
    console.error("CREATE_REVIEW_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to save review" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { feedbackId, content, status, customerName } = await req.json();

    if (!feedbackId) {
      return NextResponse.json({ error: "Missing feedbackId" }, { status: 400 });
    }

    const updateData: any = {};
    if (content) updateData.content = content;
    if (status) updateData.aiContent = status;
    if (customerName) updateData.customerName = customerName;
    if (content && !status) updateData.aiContent = "Replied";

    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: updateData
    });

    return NextResponse.json({ success: true, feedback: updatedFeedback });
  } catch (error) {
    console.error("UPDATE_REVIEW_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const businessId = url.searchParams.get("businessId");

    const businessQuery = businessId 
      ? { id: businessId, userId } 
      : { userId };

    const business = await prisma.business.findFirst({
      where: businessQuery,
      include: {
        qrCodes: {
          include: {
            feedbacks: {
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const feedbacks = business.qrCodes.flatMap(qr => qr.feedbacks).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("GET_REVIEWS_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
