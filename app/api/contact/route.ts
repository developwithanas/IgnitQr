import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await checkRateLimit(req, "contact", 5, "1 h"))) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { name, email, message } = await req.json();

    if (
      typeof name !== "string" || typeof email !== "string" || typeof message !== "string" ||
      !name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message.trim() ||
      name.length > 100 || message.length > 5000
    ) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "IgniteQR <onboarding@resend.dev>",
      to: "developwithanas@gmail.com",
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      replyTo: email,
    });

    if (error) {
      console.error("Resend Error:", error);

      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (err) {
    console.error("Contact API Error:", err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}