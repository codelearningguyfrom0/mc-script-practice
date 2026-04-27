"use client";

/** Simple bunny face in Dick Bruna style — bold outlines, flat color */
export function MiffyBunny({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* ears */}
      <ellipse cx="36" cy="28" rx="10" ry="28" fill="white" stroke="#1a1a1a" strokeWidth="3" />
      <ellipse cx="64" cy="28" rx="10" ry="28" fill="white" stroke="#1a1a1a" strokeWidth="3" />
      {/* face */}
      <circle cx="50" cy="72" r="36" fill="white" stroke="#1a1a1a" strokeWidth="3" />
      {/* eyes — small dots */}
      <circle cx="38" cy="66" r="3" fill="#1a1a1a" />
      <circle cx="62" cy="66" r="3" fill="#1a1a1a" />
      {/* mouth — X shape */}
      <path d="M46 80 L50 76 L54 80" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M46 76 L50 80 L54 76" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function MiffyBunnySmall({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="14" cy="11" rx="4" ry="11" fill="white" stroke="#1a1a1a" strokeWidth="2" />
      <ellipse cx="26" cy="11" rx="4" ry="11" fill="white" stroke="#1a1a1a" strokeWidth="2" />
      <circle cx="20" cy="30" r="14" fill="white" stroke="#1a1a1a" strokeWidth="2" />
      <circle cx="15" cy="28" r="1.5" fill="#1a1a1a" />
      <circle cx="25" cy="28" r="1.5" fill="#1a1a1a" />
      <path d="M18 33 L20 31 L22 33" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M18 31 L20 33 L22 31" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
