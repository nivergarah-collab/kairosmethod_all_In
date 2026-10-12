import type { Phase } from '../types';
import { useStore } from '../state/StoreContext';
import { PHASE_LABEL, phaseOf } from '../lib/scheduler';
import { fmtDate, todayKey } from '../lib/dates';

interface Props {
  onEdit: (id: string) => void;
}

export function Catalog({ onEdit }: Props) {
  const { state, dispatch } = useStore();

  const sortBy = (a: (typeof state.cards)[number], b: (typeof state.cards)[number]) =>
    a.due === b.due ? a.order - b.order : a.due < b.due ? -1 : 1;

  const cards = [...state.cards].sort(sortBy);

  function dueText(due: string): string {
    const t = todayKey();
    if (due <= t) return 'hoy';
    if (due === t) return 'hoy';
    return fmtDate(due);
  }

  return (
    <aside className="catalog" aria-label="Mis preguntas">
      <div className="catalog-head">
        <span className="catalog-title">Mis preguntas</span>
        <span className="catalog-count">{cards.length}</span>
      </div>
      {cards.length === 0 ? (
        <p className="catalog-empty">
          Todavía no defines preguntas. Rellena «Ficha nueva» o pulsa «Definir mi
          primera pregunta» para empezar.
        </p>
      ) : (
        <ul className="catalog-list">
          {cards.map((c) => {
            const phase: Phase = phaseOf(c);
            return (
              <li className="catalog-item" key={c.id}>
                <span className={`phase-chip phase-${phase}`}>{PHASE_LABEL[phase]}</span>
                <div className="catalog-main">
                  <p className="catalog-question">{c.question}</p>
                  <span className="catalog-due">Próximo repaso: {dueText(c.due)}</span>
                </div>
                <div className="catalog-actions">
                  <button type="button" className="catalog-btn" onClick={() => onEdit(c.id)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="catalog-btn catalog-btn-danger"
                    onClick={() => {
                      if (window.confirm('¿Borrar esta ficha?')) {
                        dispatch({ type: 'deleteCard', id: c.id });
                      }
                    }}
                  >
                    Borrar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}