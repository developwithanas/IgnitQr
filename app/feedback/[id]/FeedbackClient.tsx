"use client";

import { useState } from "react";

interface FeedbackClientProps {
  qrCodeId: string;
  businessName: string;
  location: string;
  googleLink: string;
}

export default function FeedbackClient({ qrCodeId, businessName, location, googleLink }: FeedbackClientProps) {
  const [step, setStep] = useState<"rating" | "loading" | "quotes">("rating");
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [quotes, setQuotes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [feedbackRecordId, setFeedbackRecordId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");

  const handleRatingSelect = async (selectedRating: number) => {
    setRating(selectedRating);
    setStep("loading");

    try {
      // 1. Save rating to database
      const dbRes = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selectedRating, qrCodeId }),
      });
      const dbData = await dbRes.json();
      if (dbData.feedback?.id) {
        setFeedbackRecordId(dbData.feedback.id);
      }

      // 2. Generate smart quotes based on rating
      const res = await fetch("/api/generate-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, rating: selectedRating }),
      });
      const data = await res.json();
      
      const fallbackList = [
        `Absolutely wonderful experience at ${businessName}. I couldn't be happier with the service!`,
        `Highly recommend ${businessName}! The quality and attention to detail were fantastic.`,
        `Such a great experience. ${businessName} truly knows how to treat their customers well.`,
        `Exceeded my expectations in every way. ${businessName} is my new favorite spot!`,
        `The team at ${businessName} is incredible. Professional, kind, and very helpful.`,
        `A hidden gem! ${businessName} provides top-tier service with a personal touch.`,
        `I've been to many places, but ${businessName} really stands out for their excellence.`
      ];

      if (res.ok && data.quotes) {
        setQuotes(data.quotes);
      } else {
        console.warn("Failed to generate quotes via API. Using fallbacks.");
        // Pick 3 random unique fallbacks
        const shuffled = [...fallbackList].sort(() => 0.5 - Math.random());
        setQuotes(shuffled.slice(0, 3));
      }
    } catch (e) {
      console.warn("Network or server error while generating quotes.");
      const fallbackList = [
        `Absolutely wonderful experience at ${businessName}. I couldn't be happier with the service!`,
        `Highly recommend ${businessName}! The quality and attention to detail were fantastic.`,
        `Such a great experience. ${businessName} truly knows how to treat their customers well.`,
        `Exceeded my expectations in every way. ${businessName} is my new favorite spot!`,
        `The team at ${businessName} is incredible. Professional, kind, and very helpful.`,
        `A hidden gem! ${businessName} provides top-tier service with a personal touch.`,
        `I've been to many places, but ${businessName} really stands out for their excellence.`
      ];
      const shuffled = [...fallbackList].sort(() => 0.5 - Math.random());
      setQuotes(shuffled.slice(0, 3));
    } finally {

      setStep("quotes");
    }
  };

  const handleCopy = async (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);

    if (feedbackRecordId) {
      // Save the copied quote to the database so it shows on the dashboard
      const payload: any = { feedbackId: feedbackRecordId, content: text };
      if (customerName.trim()) payload.customerName = customerName.trim();

      fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(err => console.error("Failed to save copied quote", err));
    }
  };

  const handlePostClick = () => {
    if (feedbackRecordId) {
      const payload: any = { feedbackId: feedbackRecordId, status: "Posted" };
      if (customerName.trim()) payload.customerName = customerName.trim();

      fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(err => console.error("Failed to update status to Posted", err));
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center p-6 font-sans relative overflow-hidden bg-[#0d0e15]">
      {/* Background Mesh Gradient Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-amber-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>

      {/* Main Glass Card */}
      <div className="w-full max-w-[400px] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.37)] relative z-10 flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
            {businessName}
          </h1>
          <p className="text-blue-300 font-medium flex items-center justify-center gap-1 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            {location}
          </p>
        </div>

        <p className="text-white/90 text-center font-medium mb-6 leading-relaxed">
          We value your excellent experience! <br /> Please share your feedback.
        </p>

        {/* Stars */}
        <div className="flex gap-2 justify-center mb-8">
          {[1, 2, 3, 4, 5].map((star) => {
            const isSelected = (hoveredRating || rating) >= star;
            return (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => handleRatingSelect(star)}
                disabled={step !== "rating"}
                className={`transition-all duration-300 transform ${step === "rating" ? "hover:scale-110 active:scale-95" : ""}`}
              >
                <svg 
                  className={`w-12 h-12 transition-all duration-300 drop-shadow-lg ${
                    isSelected 
                      ? "text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" 
                      : "text-white/20"
                  }`}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            )
          })}
        </div>

        {/* Loading State */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-4 w-full animate-in fade-in duration-300">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3"></div>
            <p className="text-white/70 text-sm font-medium animate-pulse">Generating quotes...</p>
          </div>
        )}

        {/* Quotes Section */}
        {step === "quotes" && (
          <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Name Input */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex items-center gap-2 group transition-all focus-within:border-white/30">
              <div className="pl-3 text-white/40">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <input 
                type="text" 
                placeholder="Enter your name (optional)" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-sm py-2 w-full placeholder:text-white/20"
              />
            </div>

            <div className="space-y-3">
              {quotes.map((quote, idx) => (
              <div 
                key={idx} 
                className="bg-white/10 backdrop-blur-md border border-white/30 rounded-xl p-4 flex items-center justify-between group hover:bg-white/20 transition-all shadow-inner"
              >
                <p className="text-white text-sm leading-snug pr-4 italic font-medium drop-shadow-sm">"{quote}"</p>
                <button
                  onClick={() => handleCopy(quote, idx)}
                  className="shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all shadow-md"
                  title="Copy to clipboard"
                >
                  {copiedIndex === idx ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  )}
                </button>
              </div>
            ))}
          </div>

            <a
              href={googleLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handlePostClick}
              className="mt-6 w-full bg-white text-slate-900 text-[15px] font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
              Post Review on Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
