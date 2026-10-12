import { dateFromDayKey } from '../time.js';

export function DemoControls({ garden, dayKey, onAction }) {
  const demo = garden.clockMode === 'demo';
  const shownDate = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(dateFromDayKey(dayKey));
  return (
    <section className="demo-controls" data-tour="demo-panel" aria-labelledby="demo-title">
      <div><p className="eyebrow">Reloj virtual</p><h2 id="demo-title">Prueba el paso del tiempo</h2><p>La demo solo cambia el jardín guardado; no modifica la hora de tu dispositivo.</p></div>
      <div className="demo-actions">
        <span className={`clock-chip ${demo ? 'is-demo' : ''}`} role="status">{demo ? `Demo · ${shownDate}` : 'Reloj real'}</span>
        <button type="button" className="button button-quiet" onClick={() => onAction({ type: 'ADVANCE_DEMO', days: 1 })}>+1 día</button>
        <button type="button" className="button button-quiet" onClick={() => onAction({ type: 'ADVANCE_DEMO', days: 7 })}>+7 días</button>
        <button type="button" className="button button-quiet" onClick={() => onAction({ type: 'SIMULATE_HEALTHY_WEEK' })}>Simular semana saludable</button>
        <button type="button" className="button button-quiet" onClick={() => onAction({ type: 'SIMULATE_RECOVERY' })}>Simular recuperación</button>
        <button type="button" className="button button-primary" disabled={!demo} onClick={() => onAction({ type: 'RETURN_TO_TODAY' })}>Volver a hoy</button>
      </div>
    </section>
  );
}
