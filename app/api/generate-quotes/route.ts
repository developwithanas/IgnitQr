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
  const byRating: Record<number, string[]> = {
    5: [
      `Had a great experience at ${businessName}. The staff were friendly and helpful.`,
      `Really happy with ${businessName} — good service and quality. Would recommend.`,
      `${businessName} took good care of us. Will definitely come back.`,
      `Smooth and pleasant visit to ${businessName}. Thank you to the team!`,
    ],
    4: [
      `Good experience at ${businessName}. Friendly staff and decent service.`,
      `Liked my visit to ${businessName}. A few small things could be better, but overall good.`,
      `${businessName} was good overall — would visit again.`,
    ],
    3: [
      `My visit to ${businessName} was okay. Some things were good, but there is room to improve.`,
      `Average experience at ${businessName}. The staff were polite, though a few things could be handled better.`,
      `${businessName} was decent overall, but not quite what I hoped for.`,
    ],
    2: [
      `My visit to ${businessName} was disappointing. I hope they work on it.`,
      `Not a great experience at ${businessName} this time. A few things need attention.`,
      `Expected better from ${businessName}. Hope it improves next time.`,
    ],
    1: [
      `I had a poor experience at ${businessName}. Things did not go as expected.`,
      `Unfortunately my visit to ${businessName} was not good. It needs real improvement.`,
      `Very unhappy with my visit to ${businessName} this time.`,
    ],
  };
  const list = byRating[rating] ?? byRating[5];
  return [...list].sort(() => 0.5 - Math.random()).slice(0, 3);
}

/** The draft must match the real rating — never nudge an unhappy customer into praise. */
const TONE: Record<number, string> = {
  5: "Warm and positive.",
  4: "Positive but measured (it was a 4-star visit).",
  3: "Balanced and mixed: some things were fine, some could be better. Polite.",
  2: "Disappointed but calm, polite and constructive.",
  1: "Honest about a poor experience, calm and respectful, no insults.",
};

// POST /api/generate-quotes  { qrCodeId, rating }
// Returns editable review drafts for any rating, in a tone that matches the stars given.
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
- Sound like a real customer, simple and honest. Tone: ${TONE[rating]}
- Match a ${rating}-star experience exactly: do not make it sound better or worse.${
      rating <= 3
        ? "\n- Never invent a specific complaint (no waiting times, cleanliness, rude staff, wrong orders). Keep any criticism general, like \"a few things could be better\", so the customer adds what really happened."
        : ""
    }
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
