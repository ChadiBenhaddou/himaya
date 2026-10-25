/** Decorative hero illustration: home router, Wi-Fi signal, protection shield and family cards. */
export function RouterIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 480 420"
      role="img"
      aria-label="راوتر Wi-Fi ديال الدار محمي بدرع، مع رموز ديال العائلة والحماية"
    >
      <defs>
        <filter id="ri-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0b1b3a" floodOpacity="0.14" />
        </filter>
        <filter id="ri-shadow-sm" x="-20%" y="-30%" width="140%" height="180%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0b1b3a" floodOpacity="0.1" />
        </filter>
        <linearGradient id="ri-router" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a3a6e" />
          <stop offset="1" stopColor="#0b1b3a" />
        </linearGradient>
      </defs>

      {/* backdrop */}
      <circle cx="240" cy="220" r="178" fill="#eef3fa" />
      <circle cx="240" cy="220" r="204" fill="none" stroke="#dbe3ef" strokeWidth="1.5" strokeDasharray="2 9" />
      <circle cx="436" cy="206" r="5" fill="#1a9e68" opacity="0.35" />
      <circle cx="52" cy="236" r="4" fill="#102a56" opacity="0.2" />
      <circle cx="250" cy="34" r="4" fill="#1a9e68" opacity="0.3" />

      {/* Wi-Fi signal */}
      <g fill="none" stroke="#1a9e68" strokeWidth="9" strokeLinecap="round">
        <path d="M186.3 142.3A76 76 0 0 1 293.7 142.3" opacity="0.4" />
        <path d="M203.2 159.2A52 52 0 0 1 276.8 159.2" opacity="0.7" />
        <path d="M220.2 176.2A28 28 0 0 1 259.8 176.2" />
      </g>
      <circle cx="240" cy="196" r="8" fill="#1a9e68" />

      {/* router */}
      <rect x="160" y="196" width="10" height="56" rx="5" fill="#1a3a6e" />
      <rect x="296" y="196" width="10" height="56" rx="5" fill="#1a3a6e" />
      <g filter="url(#ri-shadow)">
        <rect x="120" y="236" width="240" height="78" rx="20" fill="url(#ri-router)" />
      </g>
      <rect x="150" y="312" width="28" height="9" rx="4.5" fill="#0b1b3a" />
      <rect x="302" y="312" width="28" height="9" rx="4.5" fill="#0b1b3a" />
      <circle cx="152" cy="266" r="5.5" fill="#34c48a" />
      <circle cx="172" cy="266" r="5.5" fill="#34c48a" />
      <circle cx="192" cy="266" r="5.5" fill="#8fb3e8" />
      <path d="M232 260h56M232 272h56" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="4" strokeLinecap="round" />
      <rect x="140" y="292" width="170" height="2" rx="1" fill="#ffffff" opacity="0.08" />

      {/* shield */}
      <g filter="url(#ri-shadow)">
        <path
          d="M372 250 416 266v36c0 30-19 50-44 61-25-11-44-31-44-61v-36l44-16Z"
          fill="#1a9e68"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </g>
      <path d="m353 305 13 13 25-27" fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />

      {/* card: home */}
      <g filter="url(#ri-shadow-sm)">
        <rect x="36" y="86" width="132" height="62" rx="16" fill="#ffffff" />
      </g>
      <circle cx="68" cy="117" r="18" fill="#e6ecf6" />
      <path d="M58.5 119 68 110.5l9.5 8.5M61.5 116.5V126h13v-9.5" fill="none" stroke="#102a56" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="96" y="106" width="54" height="8" rx="4" fill="#c9d4e5" />
      <rect x="96" y="121" width="36" height="8" rx="4" fill="#e1e7f0" />

      {/* card: family */}
      <g filter="url(#ri-shadow-sm)">
        <rect x="320" y="58" width="130" height="62" rx="16" fill="#ffffff" />
      </g>
      <circle cx="352" cy="89" r="18" fill="#dcf3e8" />
      <g fill="none" stroke="#11774d" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="347.5" cy="83.5" r="4.2" />
        <path d="M340 99a7.5 7.5 0 0 1 15 0" />
        <circle cx="359" cy="87.5" r="3" />
        <path d="M354.5 99a4.8 4.8 0 0 1 9.4 0" />
      </g>
      <rect x="380" y="78" width="50" height="8" rx="4" fill="#c9d4e5" />
      <rect x="380" y="93" width="32" height="8" rx="4" fill="#e1e7f0" />

      {/* card: control toggle */}
      <g filter="url(#ri-shadow-sm)">
        <rect x="30" y="340" width="150" height="62" rx="16" fill="#ffffff" />
      </g>
      <circle cx="62" cy="371" r="18" fill="#dcf3e8" />
      <g fill="none" stroke="#11774d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="54.5" y="369" width="15" height="11" rx="2.5" />
        <path d="M58 369v-3.5a4 4 0 0 1 8 0v3.5" />
      </g>
      <rect x="90" y="358" width="40" height="8" rx="4" fill="#c9d4e5" />
      <rect x="90" y="373" width="26" height="8" rx="4" fill="#e1e7f0" />
      <rect x="138" y="361" width="30" height="18" rx="9" fill="#1a9e68" />
      <circle cx="159" cy="370" r="6" fill="#ffffff" />
    </svg>
  );
}
