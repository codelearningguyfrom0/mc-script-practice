"use client";

/** Cute black cat sitting — matching reference style: simple silhouette, big round eyes, tiny nose */
export function KuroCat({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* tail */}
      <path
        d="M148 280 Q180 270 190 240 Q196 218 182 210"
        stroke="#1a1a1a"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />
      {/* body */}
      <ellipse cx="100" cy="240" rx="52" ry="65" fill="#1a1a1a" />
      {/* head */}
      <ellipse cx="100" cy="130" rx="46" ry="42" fill="#1a1a1a" />
      {/* neck */}
      <rect x="75" y="155" width="50" height="40" rx="10" fill="#1a1a1a" />
      {/* left ear */}
      <path d="M62 110 L54 60 L88 100 Z" fill="#1a1a1a" />
      {/* right ear */}
      <path d="M138 110 L146 60 L112 100 Z" fill="#1a1a1a" />
      {/* left eye */}
      <circle cx="80" cy="125" r="14" fill="white" />
      <circle cx="82" cy="126" r="7" fill="#1a1a1a" />
      {/* right eye */}
      <circle cx="120" cy="125" r="14" fill="white" />
      <circle cx="122" cy="126" r="7" fill="#1a1a1a" />
      {/* nose */}
      <ellipse cx="100" cy="143" rx="4" ry="3" fill="#9a9a9a" />
      {/* paws */}
      <ellipse cx="78" cy="298" rx="16" ry="8" fill="#1a1a1a" />
      <ellipse cx="122" cy="298" rx="16" ry="8" fill="#1a1a1a" />
    </svg>
  );
}

/** Smaller cat face for inline use */
export function KuroCatFace({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="30" cy="32" rx="22" ry="20" fill="#1a1a1a" />
      <path d="M12 24 L8 6 L24 20 Z" fill="#1a1a1a" />
      <path d="M48 24 L52 6 L36 20 Z" fill="#1a1a1a" />
      <circle cx="22" cy="30" r="6" fill="white" />
      <circle cx="23" cy="30.5" r="3" fill="#1a1a1a" />
      <circle cx="38" cy="30" r="6" fill="white" />
      <circle cx="39" cy="30.5" r="3" fill="#1a1a1a" />
      <ellipse cx="30" cy="38" rx="2" ry="1.5" fill="#9a9a9a" />
    </svg>
  );
}
