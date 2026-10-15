/**
 * Illustrazione tecnica della cella Kinetix-X400 in SVG inline (nessuna immagine raster):
 * dimensioni intrinseche fisse tramite viewBox + aspect-ratio per CLS = 0.
 */
export function X400Illustration() {
  return (
    <svg
      viewBox="0 0 480 360"
      role="img"
      aria-labelledby="x400-title x400-desc"
      className="aspect-[4/3] h-auto w-full"
    >
      <title id="x400-title">Schema della Cella Robotizzata Kinetix-X400</title>
      <desc id="x400-desc">
        Manipolatore antropomorfo a 6 assi con testa di saldatura laser, profilometro di visione AI sopra il pezzo e
        nastro trasportatore con pezzi in ispezione.
      </desc>
      <defs>
        <linearGradient id="x400-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22D3EE" stopOpacity="0.9" />
          <stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="x400-arm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#263241" />
          <stop offset="1" stopColor="#141B23" />
        </linearGradient>
        <pattern id="x400-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#1A222C" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="480" height="360" rx="14" fill="#0B0F14" />
      <rect width="480" height="360" rx="14" fill="url(#x400-grid)" />

      {/* Cabina laser classe 1 */}
      <rect x="20" y="20" width="440" height="300" rx="10" fill="none" stroke="#263241" strokeDasharray="6 6" />
      <text x="32" y="40" fill="#6B7A8A" fontFamily="monospace" fontSize="10">
        CABINA LASER CLASSE 1 · PLd cat. 3
      </text>

      {/* Nastro trasportatore */}
      <rect x="40" y="262" width="400" height="18" rx="9" fill="#141B23" stroke="#263241" />
      {[60, 100, 140, 180, 220, 260, 300, 340, 380, 420].map((x) => (
        <circle key={x} cx={x} cy="271" r="4" fill="#1A222C" stroke="#263241" />
      ))}

      {/* Pezzi in linea */}
      <rect x="70" y="240" width="46" height="22" rx="3" fill="#1A222C" stroke="#10B981" strokeWidth="1.5" />
      <rect x="300" y="240" width="46" height="22" rx="3" fill="#1A222C" stroke="#263241" strokeWidth="1.5" />
      <rect x="370" y="240" width="46" height="22" rx="3" fill="#1A222C" stroke="#263241" strokeWidth="1.5" />
      <rect x="215" y="240" width="56" height="22" rx="3" fill="#1A222C" stroke="#22D3EE" strokeWidth="1.5" />
      <text x="70" y="232" fill="#34D399" fontFamily="monospace" fontSize="9">
        OK ±8µm
      </text>

      {/* Base robot */}
      <rect x="96" y="214" width="70" height="26" rx="4" fill="url(#x400-arm)" stroke="#263241" />
      <circle cx="131" cy="206" r="16" fill="#141B23" stroke="#3A4A5C" />
      {/* Braccio 1 */}
      <path d="M124 200 L178 112 L194 122 L140 210 Z" fill="url(#x400-arm)" stroke="#3A4A5C" />
      <circle cx="186" cy="116" r="12" fill="#141B23" stroke="#3A4A5C" />
      {/* Braccio 2 */}
      <path d="M182 106 L238 132 L232 148 L176 122 Z" fill="url(#x400-arm)" stroke="#3A4A5C" />
      <circle cx="236" cy="140" r="9" fill="#141B23" stroke="#3A4A5C" />
      {/* Testa laser */}
      <rect x="230" y="148" width="14" height="34" rx="3" fill="#263241" stroke="#22D3EE" />
      <path d="M237 182 L237 240" stroke="url(#x400-beam)" strokeWidth="3" />
      <circle cx="237" cy="240" r="5" fill="#22D3EE" opacity="0.85" />

      {/* Profilometro / camera AI */}
      <rect x="290" y="70" width="110" height="34" rx="6" fill="#141B23" stroke="#22D3EE" />
      <text x="300" y="91" fill="#22D3EE" fontFamily="monospace" fontSize="10">
        VISION AI 3D
      </text>
      <path d="M318 104 L262 240 L274 240 L330 104 Z" fill="#22D3EE" opacity="0.07" />
      <g className="animate-scan">
        <line x1="250" y1="90" x2="286" y2="90" stroke="#22D3EE" strokeWidth="1.5" opacity="0.8" />
      </g>

      {/* Annotazioni telemetria */}
      <g fontFamily="monospace" fontSize="9" fill="#94A3B3">
        <line x1="244" y1="164" x2="300" y2="164" stroke="#263241" />
        <text x="304" y="167">LASER 3 kW · λ 1.070 nm</text>
        <line x1="198" y1="116" x2="230" y2="60" stroke="#263241" />
        <text x="150" y="56">6 ASSI · ±0,02 mm</text>
        <text x="300" y="128" fill="#34D399">
          INFERENZA &lt; 18 ms/pz
        </text>
      </g>

      {/* Stato linea */}
      <rect x="36" y="290" width="408" height="20" rx="4" fill="#05070A" stroke="#1A222C" />
      <circle cx="48" cy="300" r="3.5" fill="#10B981" />
      <text x="58" y="303" fill="#94A3B3" fontFamily="monospace" fontSize="9">
        LINEA ATTIVA · OPC UA → MES · ispezione 100% in linea
      </text>
    </svg>
  );
}
