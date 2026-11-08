import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import { getOwnerUsage } from "@/lib/usage";

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const AI_TIMEOUT_MS = 10000;
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/** Simple starting points (Starter plan, or when AI is unavailable). The customer edits them. */
function templateSuggestions(businessName: string, rating: number): string[] {
  const five = [
    `Had a great experience at ${businessName}. The staff were friendly and helpful.`,
    `Really happy with ${businessName} — good service and quality. Would recommend.`,
    `${businessName} took good care of us. Will definitely come back.`,
    `Smooth and pleasant visit to ${businessName}. Thank you to the team!`,
  ];
  const four = [
    `Good experience at ${businessName}. Friendly staff and decent service.`,
    `Liked my visit to ${businessName}. A few small things could be better, but overall good.`,
    `${businessName} was good overall — would visit again.`,
  ];
  const list = rating >= 5 ? five : four;
  return [...list].sort(() => 0.5 - Math.random()).slice(0, 3);
}

// POST /api/generate-quotes  { qrCodeId, rating }
// Returns editable review suggestions — only for happy customers (4–5 stars).
export async function POST(req: Request) {
  try {
    if (!(await checkRateLimit(req, "quotes", 15, "10 m"))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const rating = Number(body.rating);
    const qrCodeId = typeof body.qrCodeId === "string" ? body.qrCodeId : "";
    if (!qrCodeId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "qrCodeId and rating are required" }, { status: 400 });
    }

    // No ready-made public reviews for unhappy customers.
    if (rating < 4) return NextResponse.json({ quotes: [], source: "none" });

    const qrCode = await prisma.qrCode.findUnique({
      where: { id: qrCodeId },
      select: { business: { select: { name: true, userId: true } } },
    });
    if (!qrCode) return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    const businessName = qrCode.business.name.slice(0, 100);

    const usage = await getOwnerUsage(qrCode.business.userId);
    if (!usage.limits.aiReviews || !genAI) {
      return NextResponse.json({ quotes: templateSuggestions(businessName, rating), source: "template" });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME }, { timeout: AI_TIMEOUT_MS });
    const prompt = `A customer just rated "${businessName}" ${rating} out of 5 stars and wants help starting a Google review.
Write 3 short, natural review drafts (1-2 sentences each) they can edit.
Rules:
- Sound like a real customer, simple and honest. ${rating === 4 ? "Positive but measured (it was a 4-star visit)." : "Warm and positive."}
- Mention different aspects (service, staff, quality, atmosphere) without inventing specific facts like prices, dishes or names.
- No exaggeration, no "best ever", no quotation marks, no numbering.
- Put each draft on its own line.`;

    try {
      const result = await model.generateContent(prompt);
      const quotes = result.response
        .text()
        .split(/\n+/)
        .map((q) => q.replace(/^[0-9.\-*\s]+/, "").trim().replace(/^["']|["']$/g, ""))
        .filter((q) => q.length > 10)
        .slice(0, 3);
      if (quotes.length >= 2) return NextResponse.json({ quotes, source: "ai" });
    } catch (error) {
      console.error("GENERATE_QUOTES_AI_ERROR:", error instanceof Error ? error.message : error);
    }
    return NextResponse.json({ quotes: templateSuggestions(businessName, rating), source: "template" });
  } catch (error) {
    console.error("GENERATE_QUOTES_ERROR:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
