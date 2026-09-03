"use client";

export function PharmacyIllustration() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 select-none">
      <svg
        viewBox="0 0 380 270"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[420px] h-auto"
      >
        {/* Top Shelf in Background */}
        <line x1="180" y1="106" x2="286" y2="106" stroke="#4b8cf6" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="180" y1="110" x2="286" y2="110" stroke="#4b8cf6" strokeWidth="1.2" strokeLinecap="round" />

        {/* Bottles on Top Shelf */}
        {/* Bottle 1 */}
        <rect x="186" y="93" width="15" height="13" rx="2.5" fill="#ffffff" stroke="#4b8cf6" strokeWidth="1.6" />
        <rect x="189" y="88" width="9" height="5" rx="1.5" fill="#dbeafe" stroke="#4b8cf6" strokeWidth="1.4" />

        {/* Bottle 2 (tall jar) */}
        <rect x="207" y="78" width="18" height="28" rx="3.5" fill="#ffffff" stroke="#4b8cf6" strokeWidth="1.6" />
        <path d="M209 78 L212 73 L220 73 L223 78" fill="#dbeafe" stroke="#4b8cf6" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="211" y="70" width="10" height="4" rx="1" fill="#60a5fa" stroke="#4b8cf6" strokeWidth="1.2" />

        {/* Bottle 3 */}
        <rect x="231" y="92" width="13" height="14" rx="2.5" fill="#ffffff" stroke="#4b8cf6" strokeWidth="1.6" />
        <rect x="233" y="87" width="9" height="5" rx="1.5" fill="#dbeafe" stroke="#4b8cf6" strokeWidth="1.4" />

        {/* Bottle 4 (medium) */}
        <rect x="249" y="82" width="19" height="24" rx="3.5" fill="#ffffff" stroke="#4b8cf6" strokeWidth="1.6" />
        <rect x="252" y="77" width="13" height="5" rx="1.5" fill="#dbeafe" stroke="#4b8cf6" strokeWidth="1.4" />

        {/* Bottle 5 */}
        <rect x="272" y="90" width="14" height="16" rx="2.5" fill="#ffffff" stroke="#4b8cf6" strokeWidth="1.6" />
        <rect x="274" y="86" width="10" height="4" rx="1.5" fill="#dbeafe" stroke="#4b8cf6" strokeWidth="1.4" />

        {/* Lower Shelf in Background */}
        <line x1="240" y1="154" x2="286" y2="154" stroke="#4b8cf6" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="240" y1="158" x2="286" y2="158" stroke="#4b8cf6" strokeWidth="1.2" strokeLinecap="round" />

        {/* Bottles on Lower Shelf */}
        <rect x="245" y="139" width="14" height="15" rx="2.5" fill="#ffffff" stroke="#4b8cf6" strokeWidth="1.6" />
        <rect x="247" y="135" width="10" height="4" rx="1" fill="#dbeafe" stroke="#4b8cf6" strokeWidth="1.4" />
        <line x1="249" y1="145" x2="255" y2="145" stroke="#93c5fd" strokeWidth="1.4" strokeLinecap="round" />

        <rect x="263" y="139" width="14" height="15" rx="2.5" fill="#ffffff" stroke="#4b8cf6" strokeWidth="1.6" />
        <rect x="265" y="135" width="10" height="4" rx="1" fill="#dbeafe" stroke="#4b8cf6" strokeWidth="1.4" />
        <line x1="267" y1="145" x2="273" y2="145" stroke="#93c5fd" strokeWidth="1.4" strokeLinecap="round" />

        <rect x="281" y="132" width="15" height="22" rx="3" fill="#ffffff" stroke="#4b8cf6" strokeWidth="1.6" />
        <rect x="283" y="127" width="11" height="5" rx="1.5" fill="#dbeafe" stroke="#4b8cf6" strokeWidth="1.4" />

        {/* Main Base Table Line */}
        <line x1="38" y1="216" x2="320" y2="216" stroke="#4b8cf6" strokeWidth="2.4" strokeLinecap="round" />

        {/* Potted Plant (Left) */}
        <polygon points="56,196 76,196 73,216 59,216" fill="#e2eeff" stroke="#4b8cf6" strokeWidth="1.8" strokeLinejoin="round" />
        <line x1="53" y1="196" x2="79" y2="196" stroke="#4b8cf6" strokeWidth="2.2" strokeLinecap="round" />
        {/* Plant Leaves */}
        <path d="M66 196 C66 170, 54 150, 42 144 C45 160, 58 176, 66 196 Z" fill="#60a5fa" stroke="#4b8cf6" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M66 180 C54 174, 41 162, 44 151 C52 153, 61 165, 66 180 Z" fill="#93c5fd" stroke="#4b8cf6" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M66 176 C78 166, 88 158, 86 147 C78 152, 71 163, 66 176 Z" fill="#60a5fa" stroke="#4b8cf6" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M66 160 C64 146, 62 132, 69 124 C74 134, 72 148, 66 160 Z" fill="#93c5fd" stroke="#4b8cf6" strokeWidth="1.6" strokeLinejoin="round" />

        {/* Standing Tablet Support Stand */}
        <path d="M96 216 L108 174 L124 216" stroke="#4b8cf6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="94" y1="216" x2="126" y2="216" stroke="#4b8cf6" strokeWidth="2.2" strokeLinecap="round" />

        {/* Clipboard / Tablet Body (Slightly tilted upright) */}
        <g transform="rotate(-3, 160, 165)">
          {/* Main clipboard body */}
          <rect
            x="102"
            y="110"
            width="88"
            height="106"
            rx="11"
            fill="#ffffff"
            stroke="#4b8cf6"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Rx Symbol */}
          <g transform="translate(116, 124)">
            {/* R stem */}
            <path
              d="M 2 4 L 2 26"
              stroke="#2563eb"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* R loop */}
            <path
              d="M 2 4 C 16 4, 18 15, 2 15"
              stroke="#2563eb"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* R leg */}
            <path
              d="M 10 14 L 20 26"
              stroke="#2563eb"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* x slash across leg */}
            <line
              x1="13"
              y1="18"
              x2="23"
              y2="25"
              stroke="#2563eb"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>

          {/* Lines beside Rx */}
          <line x1="148" y1="128" x2="172" y2="128" stroke="#93c5fd" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="148" y1="135" x2="178" y2="135" stroke="#93c5fd" strokeWidth="2.2" strokeLinecap="round" />

          {/* Light blue rounded chip */}
          <rect x="146" y="142" width="32" height="9" rx="3" fill="#bfdbfe" />

          {/* Lower prescription lines */}
          <line x1="116" y1="170" x2="150" y2="170" stroke="#93c5fd" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="116" y1="179" x2="145" y2="179" stroke="#93c5fd" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="116" y1="188" x2="140" y2="188" stroke="#93c5fd" strokeWidth="2.2" strokeLinecap="round" />

          {/* Sky blue accent block */}
          <rect x="154" y="167" width="26" height="20" rx="4" fill="#60a5fa" />
        </g>

        {/* Medicine Bottle (Foreground Right) */}
        {/* Cap */}
        <rect x="256" y="172" width="22" height="8" rx="2" fill="#3b82f6" stroke="#2563eb" strokeWidth="1.6" />
        {/* Ridges on cap */}
        <line x1="261" y1="174" x2="261" y2="178" stroke="#bfdbfe" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="267" y1="174" x2="267" y2="178" stroke="#bfdbfe" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="273" y1="174" x2="273" y2="178" stroke="#bfdbfe" strokeWidth="1.4" strokeLinecap="round" />

        {/* Bottle Body */}
        <rect
          x="254"
          y="180"
          width="26"
          height="36"
          rx="4.5"
          fill="#ffffff"
          stroke="#4b8cf6"
          strokeWidth="2.4"
        />

        {/* Blue Label */}
        <rect x="254" y="190" width="26" height="21" fill="#2563eb" />

        {/* White Plus on Label */}
        <path
          d="M267 196 L267 205 M262.5 200.5 L271.5 200.5"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
        />

        {/* Capsule Beside Bottle */}
        <g transform="translate(286, 203) rotate(-35)">
          <rect x="0" y="0" width="20" height="9" rx="4.5" fill="#ffffff" stroke="#4b8cf6" strokeWidth="1.8" />
          <path d="M10 0 L15.5 0 C18 0 20 2 20 4.5 C20 7 18 9 15.5 9 L10 9 Z" fill="#60a5fa" />
        </g>

        {/* Small round tablet pill */}
        <circle cx="304" cy="212" r="5" fill="#e2eeff" stroke="#4b8cf6" strokeWidth="1.8" />
        <line x1="301" y1="212" x2="307" y2="212" stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
