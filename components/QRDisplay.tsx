"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRProps {
  feedbackId: string;
}

export default function QRDisplay({ feedbackId }: QRProps) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    const generateQR = async () => {
      if (!feedbackId) return;
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const url = `${origin}/feedback/${feedbackId}`;

      const qr = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        }
      });

      setQrUrl(qr);
    };

    generateQR();
  }, [feedbackId]);

  if (!feedbackId) {
    return <p className="text-sm text-slate-500">No QR Code available.</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {qrUrl ? (
        <>
          <a 
            href={`/feedback/${feedbackId}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Click to open feedback page"
          >
            <img
              src={qrUrl}
              alt="Feedback QR Code"
              className="w-48 h-48 rounded-lg shadow-sm border border-slate-200 hover:opacity-80 transition cursor-pointer"
            />
          </a>
          <a
            href={qrUrl}
            download={`QR-${feedbackId}.png`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Download QR
          </a>
        </>
      ) : (
        <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
          <span className="text-slate-400 text-sm">Generating...</span>
        </div>
      )}
    </div>
  );
}