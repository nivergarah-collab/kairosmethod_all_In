// Vista «en uso» de este tipo de elemento. Reemplazable por una imagen real o una ventana
// flotante sin tocar ItemCard.
export default function LampLive({ item, dispatch }) {
  const on = item.config.on;
  return (
    <button
      type="button"
      className={`v-live v-lamp${on ? ' on' : ''}`}
      aria-pressed={on}
      aria-label={`Lámpara ${on ? 'encendida' : 'apagada'}. Tocar para ${on ? 'apagar' : 'encender'}`}
      onClick={() => dispatch({ type: 'config', id: item.id, patch: { on: !on } })}
    >
      <svg viewBox="0 0 120 150" aria-hidden="true">
        <defs>
          <radialGradient id={`bulb-${item.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff7c9" />
            <stop offset="1" stopColor="#ffd25a" />
          </radialGradient>
        </defs>
        {on && <ellipse cx="38" cy="62" rx="44" ry="40" fill="#ffd25a" opacity=".28" className="halo" />}
        <ellipse cx="60" cy="140" rx="30" ry="6" fill="#000" opacity=".18" />
        <rect x="36" y="128" width="48" height="10" rx="5" fill="#3c3a37" />
        <path d="M60 128 L60 84 L88 30" stroke="#55524d" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="60" cy="84" r="5" fill="#8b867e" />
        <path d="M18 56 Q40 14 82 22 L74 62 Q46 70 18 56Z" fill={on ? '#e9a83a' : '#6d6a64'} />
        <ellipse cx="46" cy="60" rx="24" ry="7" transform="rotate(-8 46 60)" fill={on ? `url(#bulb-${item.id})` : '#a9a49a'} />
      </svg>
      <span className="v-caption">{on ? 'Encendida' : 'Apagada'}</span>
    </button>
  );
}
