import { useEffect, useRef } from 'react';

// Confirmación modal reutilizable (vaciar el escritorio, cargar un ejemplo sobre un escritorio
// con elementos). Foco atrapado, Escape cancela y el foco vuelve a donde estaba.
export default function ConfirmDialog({ title, text, confirmLabel, onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector('button')?.focus();
    return () => prev?.focus?.();
  }, []);
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCancel();
    } else if (e.key === 'Tab') {
      const f = [...ref.current.querySelectorAll('button')];
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  };
  return (
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={ref} className="dialog" role="alertdialog" aria-modal="true" aria-label={title} aria-describedby="confirm-text" onKeyDown={onKeyDown}>
        <header>
          <h2>{title}</h2>
        </header>
        <p id="confirm-text" className="tool-hint">{text}</p>
        <footer>
          <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn primary" onClick={onConfirm}>{confirmLabel}</button>
        </footer>
      </div>
    </div>
  );
}
