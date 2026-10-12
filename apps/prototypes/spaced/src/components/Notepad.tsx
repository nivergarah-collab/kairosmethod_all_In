import { useState } from 'react';
import { useStore } from '../state/StoreContext';
import { goalDone, goalProgress } from '../state/selectors';
import { daysBetween, plural, todayKey } from '../lib/dates';

export function Notepad() {
  const { state, dispatch } = useStore();
  const { streak, settings } = state;

  const [goalText, setGoalText] = useState(String(settings.dailyGoal));

  const done = goalDone(state);
  const pct = settings.dailyGoal > 0 ? (goalProgress(state) / settings.dailyGoal) * 100 : 0;

  const diff = settings.periodEnd ? daysBetween(todayKey(), settings.periodEnd) : null;

  return (
    <aside className="notepad" aria-label="Meta del día">
      <h2 className="notepad-title">Meta del día</h2>

      <div className="goal-row">
        <input
          className="goal-input"
          type="number"
          min="1"
          max="99"
          value={goalText}
          aria-label="Tarjetas meta por día"
          onChange={(e) => {
            setGoalText(e.target.value);
            const n = parseInt(e.target.value, 10);
            if (Number.isFinite(n)) dispatch({ type: 'setGoal', value: n });
          }}
        />
        <span className="goal-unit">tarjetas repasadas</span>
      </div>

      <div className="goal-state">
        <span className={`checkbox${done ? ' is-checked' : ''}`} aria-hidden="true"></span>
        <span className="goal-progress">{goalProgress(state)} / {settings.dailyGoal}</span>
      </div>

      <div className="goal-bar" aria-hidden="true">
        <div className={`goal-fill${done ? ' is-done' : ''}`} style={{ width: `${pct}%` }}></div>
      </div>

      <div className="streak">
        <svg className="flame" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M12 2c1.5 3.5-2 5-2 8a3.5 3.5 0 0 0 7 0c0-1.5-.7-2.7-1.5-3.7 2.6 1.6 4.5 4.4 4.5 7.4A8 8 0 0 1 4 13.7C4 8.9 8.5 6.5 12 2z" fill="#E8863A"/>
        </svg>
        <span><b>{streak.count}</b> días seguidos repasando</span>
      </div>

      <div className="period">
        <span className="period-label">Periodo de estudio</span>
        <label className="period-field">
          <span className="period-caption">Fecha objetivo</span>
          <input
            className="period-input"
            type="date"
            min={todayKey()}
            value={settings.periodEnd ?? ''}
            aria-label="Fecha objetivo del periodo de estudio"
            onChange={(e) => {
              const v = e.target.value || null;
              dispatch({ type: 'setPeriodEnd', date: v });
            }}
          />
        </label>
        {diff === null ? (
          <p className="period-hint">Define hasta cuándo necesitas las respuestas (ej. día del examen).</p>
        ) : diff > 1 ? (
          <p className="period-hint">{plural(diff, 'día')} para tu fecha objetivo.</p>
        ) : diff === 1 ? (
          <p className="period-hint">Mañana es tu fecha objetivo.</p>
        ) : diff === 0 ? (
          <p className="period-hint period-due">¡Hoy es tu fecha objetivo!</p>
        ) : (
          <p className="period-hint period-over">Pasó hace {plural(-diff, 'día')}. Define una nueva fecha.</p>
        )}
      </div>
    </aside>
  );
}