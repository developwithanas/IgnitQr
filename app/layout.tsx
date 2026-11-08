import "./globals.css";

export const metadata = {
  title: "IgniteQR - Turn Scans into 5-Star Reviews",
  description: "AI-Powered Google Reviews & Customer Feedback Growth Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
