import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/keep-alive
 * Yeh route Render ke Cron Job se trigger hota hai har 10 minutes mein.
 * Yeh apni website ke /api/ping ko call karta hai taaki server
 * active rahe aur spin-down na ho.
 *
 * Render Cron Job setup:
 *   Command: GET https://your-app.onrender.com/api/keep-alive
 *   Schedule: *\/10 * * * *  (har 10 minute)
 */
export async function GET(request: NextRequest) {
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin ||
    "http://localhost:3000";

  try {
    const pingUrl = `${SITE_URL}/api/ping`;

    const response = await fetch(pingUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent": "IgniteQR-KeepAlive/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Ping failed with status: ${response.status}`);
    }

    const data = await response.json();

    console.log(`[Keep-Alive] ✅ Ping successful at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: "Keep-alive ping successful",
      pingResponse: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Keep-Alive] ❌ Ping failed: ${errMsg}`);

    return NextResponse.json(
      {
        success: false,
        message: "Keep-alive ping failed",
        error: errMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
