// Vista «en uso» de este tipo de elemento. Reemplazable por una imagen real o una ventana
// flotante sin tocar ItemCard.
export default function NotesLive({ item, dispatch }) {
  return (
    <div className="v-live v-notes">
      <strong className="v-notes-title">{item.config.title || 'Notas'}</strong>
      <textarea
        data-nodrag
        aria-label="Texto de las notas"
        placeholder="Escribe aquí…"
        maxLength={500}
        value={item.config.text}
        onChange={(e) => dispatch({ type: 'config', id: item.id, patch: { text: e.target.value } })}
      />
    </div>
  );
}
