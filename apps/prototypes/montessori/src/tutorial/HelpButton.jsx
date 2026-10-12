// Botón «?» que vuelve a abrir el tutorial. Vive en la barra superior.
export default function HelpButton({ onClick }) {
  return (
    <button type="button" className="btn ghost help-btn" aria-label="Ver tutorial" title="Ver tutorial" data-tour-help onClick={onClick}>
      <span aria-hidden="true">?</span>
    </button>
  );
}
