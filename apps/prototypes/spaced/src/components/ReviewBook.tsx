import type { Card, Quality } from '../types';
import { PHASE_LABEL, phaseOf } from '../lib/scheduler';
import { fmtDate, plural, todayKey } from '../lib/dates';

export interface StampDef {
  quality: Quality;
  label: string;
  className: string;
}

export const STAMPS: StampDef[] = [
  { quality: 1, label: 'Olvidé', className: 'stamp-1' },
  { quality: 3, label: 'Difícil', className: 'stamp-2' },
  { quality: 4, label: 'Bien', className: 'stamp-3' },
  { quality: 5, label: 'Fácil', className: 'stamp-4' },
];

interface Props {
  card: Card;
  queueLength: number;
  revealed: boolean;
  pressing: Quality | null;
  onReveal: () => void;
  onRate: (q: Quality) => void;
}

export function ReviewBook({ card, queueLength, revealed, pressing, onReveal, onRate }: Props) {
  const phase = phaseOf(card);
  const vencida = card.due < todayKey();
  const badge = `${PHASE_LABEL[phase]}${card.interval > 0 ? ` · cada ${card.interval} d` : ' · nueva'}${vencida ? ' · vencida' : ''}`;

  return (
    <section className="book">
      <div className="page page-left">
        <div className="page-head">
          <span>Pendientes hoy: {plural(queueLength, 'tarjeta')}</span>
          <span className="page-badge">{badge}</span>
        </div>
        <span className="page-label">Pregunta</span>
        <p className="question">{card.question}</p>
        <p className="page-meta" hidden={card.reps === 0}>
          {`Repasos: ${card.reps}${card.lastReview ? ` · Última revisión: ${fmtDate(card.lastReview)}` : ''}`}
        </p>
      </div>

      <div className="page page-right">
        <span className="page-label">Respuesta</span>

        {revealed ? (
          card.answer ? (
            <div className="ink-wrap">
              <p className="ink">{card.answer}</p>
            </div>
          ) : (
            <p className="ink ink-oral">
              No escribiste respuesta: respóndela en voz alta y compara con tu apunte antes de sellar.
            </p>
          )
        ) : (
          <p className="ink-placeholder">La respuesta aún no se ha escrito…</p>
        )}

        <div className="page-actions">
          <button className="btn-ink" type="button" onClick={onReveal} hidden={revealed}>
            Abrir respuesta
          </button>

          <div hidden={!revealed}>
            <span className="stamps-label">Sella tu calificación</span>
            <div className="stamps-row">
              {STAMPS.map((s) => (
                <button
                  key={s.quality}
                  className={`stamp ${s.className}${pressing === s.quality ? ' is-pressing' : ''}`}
                  type="button"
                  onClick={() => onRate(s.quality)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}