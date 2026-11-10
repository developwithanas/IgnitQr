"use client";

import { useRef, useState } from "react";

interface FeedbackClientProps {
  qrCodeId: string;
  businessName: string;
  location: string;
  googleLink: string;
  /** false when the owner's free monthly limit is used up */
  accepting: boolean;
}

type Step = "rating" | "saving" | "review" | "thanks" | "paused";

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

export default function FeedbackClient({ qrCodeId, businessName, location, googleLink, accepting }: FeedbackClientProps) {
  const [step, setStep] = useState<Step>(accepting ? "rating" : "paused");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [thanksText, setThanksText] = useState("");
  // Ignore draft responses that arrive after the customer already picked another star.
  const draftRequest = useRef(0);

  const saveUpdate = (payload: Record<string, string>) =>
    feedbackId
      ? fetch("/api/reviews", {
          method: "PATCH",
          // keepalive: finishes even if the customer switches to the Google tab/app right away
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedbackId, ...payload, ...(customerName.trim() ? { customerName: customerName.trim() } : {}) }),
        }).catch(() => null)
      : Promise.resolve(null);

  const loadDrafts = async (selected: number, replaceText: boolean) => {
    const request = ++draftRequest.current;
    setLoadingSuggestions(true);
    try {
      const res = await fetch("/api/generate-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCodeId, rating: selected }),
      });
      const data = await res.json().catch(() => ({}));
      if (request !== draftRequest.current) return;
      const list: string[] = Array.isArray(data.quotes) ? data.quotes : [];
      setSuggestions(list);
      if (replaceText) setReviewText(list[0] ?? "");
    } catch {
      // No drafts: the customer can still type their own review.
    } finally {
      if (request === draftRequest.current) setLoadingSuggestions(false);
    }
  };

  // Changing the stars after the first tap: update the saved rating and refresh the drafts.
  const changeRating = (selected: number) => {
    if (selected === rating) return;
    // Keep text the customer wrote themselves; replace it only if it is still one of our drafts.
    const ownText = reviewText.trim() !== "" && !suggestions.includes(reviewText);
    setRating(selected);
    saveUpdate({ rating: String(selected) });
    loadDrafts(selected, !ownText);
  };

  const handleRatingSelect = async (selected: number) => {
    if (step === "review") return changeRating(selected);
    setRating(selected);
    setStep("saving");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selected, qrCodeId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 && data.code === "paused") {
        setStep("paused");
        return;
      }
      if (data.feedback?.id) setFeedbackId(data.feedback.id);
    } catch {
      // Still let the customer continue even if saving failed.
    }

    // Every rating gets editable drafts in a tone that matches the stars.
    setStep("review");
    await loadDrafts(selected, true);
  };

  const copyAndPost = async () => {
    const text = reviewText.trim();
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    }
    saveUpdate({ ...(text ? { content: text } : {}), status: "Posted" });
    if (googleLink) window.open(googleLink, "_blank", "noopener,noreferrer");
    setThanksText(
      googleLink
        ? "Your review text is copied — just paste it on Google and tap Post. Thank you! 🙏"
        : "Thank you for your feedback! 🙏"
    );
    setStep("thanks");
  };

  const sendPrivateFeedback = async () => {
    if (!reviewText.trim()) return;
    setBusy(true);
    await saveUpdate({ content: reviewText.trim(), status: "Private" });
    setBusy(false);
    setThanksText(`Thank you for telling us. The team at ${businessName} will use this to improve. 🙏`);
    setStep("thanks");
  };

  const googleButton = (label: string, subtle = false) =>
    googleLink ? (
      <a
        href={googleLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => saveUpdate({ status: "Posted" })}
        className={
          subtle
            ? "w-full text-center text-sm font-semibold text-blue-300 hover:text-blue-200 underline underline-offset-4 py-2"
            : "w-full bg-white text-slate-900 text-[15px] font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
        }
      >
        {!subtle && (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
        )}
        {label}
      </a>
    ) : null;

  const nameInput = (
    <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex items-center gap-2 transition-all focus-within:border-white/30">
      <div className="pl-3 text-white/40">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
      </div>
      <input
        type="text"
        placeholder="Your name (optional)"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        maxLength={100}
        className="bg-transparent border-none outline-none text-white text-sm py-2 w-full placeholder:text-white/30"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex justify-center items-center p-6 font-sans relative overflow-hidden bg-[#0d0e15]">
      {/* Background Mesh Gradient Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-amber-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>

      {/* Main Glass Card */}
      <div className="w-full max-w-[420px] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.37)] relative z-10 flex flex-col items-center">
        {/* Header */}
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">{businessName}</h1>
          <p className="text-blue-300 font-medium flex items-center justify-center gap-1 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            {location}
          </p>
        </div>

        {step === "paused" ? (
          <div className="w-full space-y-5 text-center">
            <p className="text-white/80 leading-relaxed">Thanks for visiting! You can share your experience directly on Google.</p>
            {googleButton("Write a Review on Google")}
          </div>
        ) : step === "thanks" ? (
          <div className="w-full space-y-4 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/90 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.5)]">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <p className="text-white font-semibold leading-relaxed">{thanksText}</p>
            {copied && googleLink && googleButton("Open Google Reviews again", true)}
          </div>
        ) : (
          <>
            <p className="text-white/90 text-center font-medium mb-6 leading-relaxed">
              {step === "rating" || step === "saving" ? (
                <>How was your experience? <br /> Tap a star to rate us.</>
              ) : rating >= 4 ? (
                "We're so glad you enjoyed it! 😊"
              ) : rating === 3 ? (
                "Thanks for your honest rating! 🙏"
              ) : (
                "We're sorry it wasn't great. 😔"
              )}
            </p>

            {/* Stars */}
            <div className="flex gap-2 justify-center mb-8">
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected = (hoveredRating || rating) >= star;
                const canTap = step === "rating" || step === "review";
                return (
                  <button
                    key={star}
                    onMouseEnter={() => canTap && setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => handleRatingSelect(star)}
                    disabled={!canTap}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    className={`transition-all duration-300 transform ${canTap ? "hover:scale-110 active:scale-95" : ""}`}
                  >
                    <svg
                      className={`w-12 h-12 transition-all duration-300 drop-shadow-lg ${
                        isSelected ? "text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" : "text-white/20"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d={STAR_PATH} />
                    </svg>
                  </button>
                );
              })}
            </div>

            {step === "saving" && (
              <div className="flex flex-col items-center justify-center py-4 w-full">
                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3"></div>
              </div>
            )}

            {/* Every rating: editable review draft -> Google (1–3 stars may also message the owner privately) */}
            {step === "review" && (
              <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {nameInput}
                <div className="space-y-2">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Your review (edit it in your own words)</p>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder={loadingSuggestions ? "Preparing a few ideas..." : "Tell others about your visit..."}
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white text-sm leading-relaxed placeholder:text-white/30 outline-none focus:border-white/40 resize-none"
                  />
                  {suggestions.length > 1 && (
                    <div className="space-y-1.5">
                      <p className="text-white/40 text-[11px]">Need ideas? Tap one to start from it:</p>
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setReviewText(s)}
                          className={`w-full text-left text-xs leading-snug rounded-lg px-3 py-2 border transition ${
                            reviewText === s ? "bg-white/20 border-white/40 text-white" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {googleLink ? (
                  <button
                    onClick={copyAndPost}
                    className="w-full bg-white text-slate-900 text-[15px] font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
                    Copy &amp; Post on Google
                  </button>
                ) : (
                  <button onClick={copyAndPost} className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl">
                    Submit Feedback
                  </button>
                )}
                {rating <= 3 && (
                  <button
                    onClick={sendPrivateFeedback}
                    disabled={busy || !reviewText.trim()}
                    className="w-full border border-white/30 text-white text-sm font-semibold py-3 rounded-xl hover:bg-white/10 transition disabled:opacity-50"
                  >
                    {busy ? "Sending..." : "Or send it privately to the owner"}
                  </button>
                )}
                <p className="text-white/40 text-[11px] text-center">Please share your honest, real experience.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
