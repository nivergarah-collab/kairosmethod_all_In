// Vista «en uso» de este tipo de elemento. Reemplazable por una imagen real o una ventana
// flotante sin tocar ItemCard.
import { formatClock } from '../../state.js';

export default function TimerLive({ item, timer, dispatch }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const frac = timer.total > 0 ? timer.left / timer.total : 0;
  const ended = timer.total > 0 && timer.left === 0;
  const step = (d) =>
    dispatch({ type: 'config', id: item.id, patch: { minutes: item.config.minutes + d } });
  return (
    <div className="v-live v-timer">
      <div className={`ring${ended ? ' ended' : ''}`}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={R} className="ring-track" />
          <circle
            cx="60"
            cy="60"
            r={R}
            className="ring-bar"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <output className="ring-digits" aria-live="off" aria-label="Tiempo restante">
          {formatClock(timer.left)}
        </output>
      </div>
      <span className="sr-only" role="status">{ended ? 'El temporizador terminó.' : ''}</span>
      <div className="v-row" data-nodrag>
        <button type="button" className="mini" aria-label="Restar 5 minutos" disabled={timer.running} onClick={() => step(-5)}>
          −5
        </button>
        <button type="button" className="mini primary" onClick={timer.toggle} disabled={timer.left === 0}>
          {timer.running ? '⏸ Pausar' : '▶ Iniciar'}
        </button>
        <button type="button" className="mini" aria-label="Sumar 5 minutos" disabled={timer.running} onClick={() => step(5)}>
          +5
        </button>
      </div>
      <button type="button" className="mini link" onClick={timer.reset}>
        ↺ Reiniciar
      </button>
    </div>
  );
}
