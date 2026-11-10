export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { getOwnerUsage } from "@/lib/usage";

// Customers can only update their own feedback shortly after leaving it.
const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    if (!(await checkRateLimit(req, "review", 20, "10 m"))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const rating = Number(body.rating);
    const qrCodeId = typeof body.qrCodeId === "string" ? body.qrCodeId : "";

    if (!qrCodeId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const qrCode = await prisma.qrCode.findUnique({
      where: { id: qrCodeId },
      select: { id: true, business: { select: { userId: true } } },
    });
    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    // Plan limit: monthly feedback for the business owner (Starter = 50/month)
    const usage = await getOwnerUsage(qrCode.business.userId);
    if (!usage.acceptingFeedback) {
      return NextResponse.json({ code: "paused", error: "This business isn't collecting feedback right now." }, { status: 403 });
    }

    // Count the scan and save the rating together
    const [, newFeedback] = await prisma.$transaction([
      prisma.qrCode.update({
        where: { id: qrCodeId },
        data: { scans: { increment: 1 } },
      }),
      prisma.feedback.create({
        data: { rating, qrCodeId },
      }),
    ]);

    return NextResponse.json({ success: true, feedback: { id: newFeedback.id } });
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
    if (!(await checkRateLimit(req, "review-update", 40, "10 m"))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { feedbackId, content, status, customerName, rating } = await req.json();

    if (!feedbackId || typeof feedbackId !== "string") {
      return NextResponse.json({ error: "Missing feedbackId" }, { status: 400 });
    }

    const existing = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: { createdAt: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }
    if (Date.now() - existing.createdAt.getTime() > EDIT_WINDOW_MS) {
      return NextResponse.json({ error: "This feedback can no longer be edited" }, { status: 403 });
    }

    const updateData: { content?: string; aiContent?: string; customerName?: string; rating?: number } = {};
    // The customer may change their star rating within the edit window.
    const newRating = Number(rating);
    if (rating !== undefined && Number.isInteger(newRating) && newRating >= 1 && newRating <= 5) {
      updateData.rating = newRating;
    }
    if (typeof content === "string" && content.trim()) updateData.content = content.trim().slice(0, 2000);
    if (status === "Posted") updateData.aiContent = "Posted";
    // Private feedback from unhappy customers — goes to the owner only.
    if (status === "Private") updateData.aiContent = "Private";
    if (typeof customerName === "string" && customerName.trim()) {
      updateData.customerName = customerName.trim().slice(0, 100);
    }
    if (updateData.content && !updateData.aiContent) updateData.aiContent = "Replied";

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await prisma.feedback.update({
      where: { id: feedbackId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
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
    const session = await getSession();
    const userId = session?.userId;

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
