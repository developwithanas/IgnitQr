/** ₹ (Indian Rupee) icon — inherits text color, sized via className. */
export default function RupeeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="M6 3h3a5 5 0 0 1 0 10H6l9 8" />
    </svg>
  );
}

/** ₹ inside a filled circle — for badges and buttons. */
export function RupeeBadge({ className = "w-8 h-8", iconClassName = "w-4 h-4" }: { className?: string; iconClassName?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-amber-500 text-black shrink-0 ${className}`}>
      <RupeeIcon className={iconClassName} />
    </span>
  );
}
