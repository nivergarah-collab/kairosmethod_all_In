import { useEffect, useRef } from 'react';
import { formatClock } from '../state.js';
import { downloadJson } from '../download.js';

// Lista corta con ✓ / ○ de lo hecho y lo pendiente.
const Checklist = ({ title, items }) =>
  items.length > 0 && (
    <section className="sum-notes" aria-label={title}>
      <h3>{title}</h3>
      <ul className="sum-list">
        {items.map((e, i) => (
          <li key={i} className={e.done ? 'done' : ''}>
            <span aria-hidden="true">{e.done ? '✓' : '○'}</span>
            <span className="sr-only">{e.done ? 'Hecha: ' : 'Pendiente: '}</span>
            {e.text}
          </li>
        ))}
      </ul>
    </section>
  );

const Row = ({ label, children }) => (
  <div className="sum-row">
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

// Resumen final al terminar la sesión.
export default function SummaryDialog({ summary, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('button')?.focus();
  }, []);
  const stamp = summary.finishedAt.slice(0, 16).replace(/[:T]/g, '-');
  return (
    <div className="scrim">
      <div
        ref={ref}
        className="dialog summary"
        role="dialog"
        aria-modal="true"
        aria-label="Resumen de la sesión"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'Tab') {
            const f = [...ref.current.querySelectorAll('button')];
            if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
            else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
          }
        }}
      >
        <header>
          <h2>Sesión terminada</h2>
          <p className="tool-hint">Tu escritorio queda guardado para la próxima vez. La lista de tareas y las metas se limpian.</p>
        </header>
        <dl className="sum">
          <Row label="Duración">{formatClock(summary.durationSeconds)}</Row>
          <Row label="Tareas hechas">
            {summary.tasks.done} de {summary.tasks.total}
          </Row>
          <Row label="Metas">
            {summary.goals.done} de {summary.goals.total}
          </Row>
          <Row label="Distracciones anotadas">{summary.distractions.length}</Row>
        </dl>
        <Checklist title="Tareas" items={summary.tasks.items} />
        <Checklist title="Metas" items={summary.goals.items} />
        {summary.notes.length > 0 && (
          <section className="sum-notes" aria-label="Notas de la sesión">
            <h3>Notas</h3>
            {summary.notes.map((n, i) => (
              <p key={i}>
                <strong>{n.title}:</strong> {n.text}
              </p>
            ))}
          </section>
        )}
        <footer>
          <button type="button" className="btn ghost" onClick={() => downloadJson(`resumen-sesion-${stamp}.json`, summary)}>
            Descargar resumen (JSON)
          </button>
          <button type="button" className="btn primary" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
