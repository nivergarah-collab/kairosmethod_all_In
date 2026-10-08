// Vista «en uso» de este tipo de elemento. Reemplazable por una imagen real o una ventana
// flotante sin tocar ItemCard.
export default function WaterLive({ item, dispatch }) {
  const filled = item.config.filled;
  return (
    <button
      type="button"
      className={`v-live v-water${filled ? ' full' : ''}`}
      aria-pressed={filled}
      aria-label={`Vaso ${filled ? 'lleno' : 'vacío'}. Tocar para ${filled ? 'vaciar' : 'llenar'}`}
      onClick={() => dispatch({ type: 'config', id: item.id, patch: { filled: !filled } })}
    >
      <svg viewBox="0 0 100 130" aria-hidden="true">
        <defs>
          <clipPath id={`glass-${item.id}`}>
            <path d="M20 14 H80 L74 118 Q73 124 66 124 H34 Q27 124 26 118 Z" />
          </clipPath>
          <linearGradient id={`water-${item.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fd0ee" />
            <stop offset="1" stopColor="#3f94c9" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="126" rx="34" ry="4" fill="#000" opacity=".15" />
        <g clipPath={`url(#glass-${item.id})`}>
          <rect x="10" y="10" width="80" height="120" fill="#ffffff" opacity=".35" />
          <rect
            className="water-level"
            x="10"
            width="80"
            height="120"
            y={filled ? 38 : 124}
            fill={`url(#water-${item.id})`}
            opacity=".9"
          />
        </g>
        <path d="M20 14 H80 L74 118 Q73 124 66 124 H34 Q27 124 26 118 Z" fill="none" stroke="#6a8ea3" strokeWidth="3" strokeLinejoin="round" />
        <path d="M30 24 L34 108" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      </svg>
      <span className="v-caption">{filled ? 'Vaso lleno' : 'Vaso vacío'}</span>
    </button>
  );
}
