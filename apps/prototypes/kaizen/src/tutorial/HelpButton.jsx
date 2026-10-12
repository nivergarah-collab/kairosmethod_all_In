export function HelpButton({ onClick }) {
  return (
    <button type="button" className="tour-help" data-tour="help" aria-label="Ver tutorial" title="Ver tutorial" onClick={onClick}>
      <span aria-hidden="true">?</span>
    </button>
  );
}
