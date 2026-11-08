import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";

// "gemini-1.5-flash" was retired by Google. Override with GEMINI_MODEL if needed.
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const AI_TIMEOUT_MS = 10000;

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    if (!(await checkRateLimit(req, "quotes", 15, "10 m"))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const businessName = typeof body.businessName === "string" ? body.businessName.trim().slice(0, 100) : "";
    const rating = Number(body.rating);

    if (!businessName || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Business name and rating are required" }, { status: 400 });
    }

    if (!genAI) {
      // Fallback if no API key is provided
      return NextResponse.json({
        quotes: [
          `Absolutely wonderful experience at ${businessName}. I couldn't be happier with the service!`,
          `Highly recommend ${businessName}! The quality and attention to detail were fantastic.`,
          `Such a great experience. ${businessName} truly knows how to treat their customers well.`,
        ],
      });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME }, { timeout: AI_TIMEOUT_MS });

    const styles = [
      "highly professional and elegant",
      "friendly and enthusiastic",
      "concise and impactful",
      "warm and personal",
      "modern and trendy"
    ];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];

    const prompt = `Write 3 unique, distinct, and human-like customer review quotes for a business named "${businessName}". 
The customer gave a rating of ${rating} out of 5 stars. 
Tone: ${randomStyle}.
Rules:
- Each quote must be 1-2 sentences.
- Do not use generic phrases like "I couldn't be happier".
- Focus on different aspects (service, atmosphere, quality, etc).
- Do not include quotation marks or numbers.
- Separate each quote with a distinct empty line.
- Avoid repetitive patterns.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const quotes = text
      .split(/\n+/)
      .map((q) => q.replace(/^[0-9.\-*\s]+/, "").trim().replace(/^["']|["']$/g, ""))
      .filter((q) => q.length > 10)
      .slice(0, 3);

    const fallbacks = [
      `Absolutely wonderful experience at ${businessName}. I couldn't be happier with the service!`,
      `Highly recommend ${businessName}! The quality and attention to detail were fantastic.`,
      `Such a great experience. ${businessName} truly knows how to treat their customers well.`,
      `I've been to many places, but ${businessName} really stands out for their excellence.`,
      `The team at ${businessName} is incredible. Professional, kind, and very helpful.`,
      `Exceeded my expectations in every way. ${businessName} is my new favorite spot!`,
      `A hidden gem! ${businessName} provides top-tier service with a personal touch.`
    ];

    // If parsing failed or not enough quotes, fill with random fallbacks
    while (quotes.length < 3) {
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      if (!quotes.includes(randomFallback)) {
        quotes.push(randomFallback);
      }
    }

    return NextResponse.json({ quotes });

  } catch (error) {
    console.error("GENERATE_QUOTES_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to generate quotes" },
      { status: 500 }
    );
  }
}
