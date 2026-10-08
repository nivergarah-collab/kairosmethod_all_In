// Vista «en uso» de este tipo de elemento. Reemplazable por una imagen real o una ventana
// flotante sin tocar ItemCard.
export default function FileLive({ item }) {
  const c = item.config;
  return (
    <div className="v-live v-file">
      <svg viewBox="0 0 64 80" className="sheet" aria-hidden="true">
        <path d="M6 4 H40 L58 22 V74 Q58 76 56 76 H8 Q6 76 6 74Z" fill="#fff" stroke="#c9c1ae" strokeWidth="2" />
        <path d="M40 4 V22 H58" fill="#ece5d3" stroke="#c9c1ae" strokeWidth="2" strokeLinejoin="round" />
        <path d="M16 36 H48 M16 46 H48 M16 56 H36" stroke="#d6cfbd" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="v-file-text">
        <span className="v-badge">{c.kind}</span>
        <strong>{c.name || 'Sin nombre'}</strong>
        <span className="v-hint">Archivo de estudio</span>
      </div>
    </div>
  );
}
