// Vista «en uso» de este tipo de elemento. Reemplazable por una imagen real o una ventana
// flotante sin tocar ItemCard.
export default function MusicLive({ item }) {
  const c = item.config;
  return (
    <div className="v-live v-music">
      <svg viewBox="0 0 80 80" className="disc" aria-hidden="true">
        <circle cx="40" cy="40" r="38" fill="#232120" />
        <circle cx="40" cy="40" r="30" fill="none" stroke="#3a3735" strokeWidth="1" />
        <circle cx="40" cy="40" r="23" fill="none" stroke="#3a3735" strokeWidth="1" />
        <circle cx="40" cy="40" r="14" fill="#c4553a" />
        <circle cx="40" cy="40" r="3" fill="#f6efe2" />
        <path d="M14 26 A30 30 0 0 1 30 12" stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <div className="v-music-text">
        <span className="v-kicker">♪ {c.mood}</span>
        <strong>{c.playlist || 'Sin playlist escrita'}</strong>
        <span className="v-hint">Referencia: aún no reproduce</span>
      </div>
    </div>
  );
}
