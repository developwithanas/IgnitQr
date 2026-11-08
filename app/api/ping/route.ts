import { NextResponse } from "next/server";

/**
 * GET /api/ping
 * Health-check endpoint — Render keep-alive ke liye use hota hai.
 * Yeh route website ko "alive" rakhta hai taaki Render free tier
 * spin-down na kare.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      message: "IgniteQR is alive! 🚀",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
