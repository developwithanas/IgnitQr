// Public business details shown on the Contact / legal pages (Razorpay checks these).
// Phone and address are optional — set them in .env and on Render, then rebuild.
export const BUSINESS = {
  name: "IgniteQR",
  website: process.env.NEXT_PUBLIC_SITE_URL || "",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "developwithanas@gmail.com",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
  supportHours: "Monday – Saturday, 10:00 AM – 7:00 PM IST",
  lastUpdated: "9 November 2026",
};
