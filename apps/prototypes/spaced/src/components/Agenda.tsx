import { useState } from 'react';
import { useStore } from '../state/StoreContext';
import { agendaEntries } from '../state/selectors';
import { fmtDate, plural, todayKey } from '../lib/dates';

export function Agenda() {
  const { state } = useStore();
  const entries = agendaEntries(state);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  // Construir mapa de fechas con conteos para la vista de calendario
  const dueMap = new Map<string, number>();
  for (const c of state.cards) {
    if (c.due > todayKey()) {
      dueMap.set(c.due, (dueMap.get(c.due) || 0) + 1);
    }
  }

  // Generar días del mes actual y siguiente para vista calendario
  function generateCalendarDays() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Primer día del mes actual
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDay = firstDay.getDay(); // 0 = domingo

    // Último día del mes actual
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days: Array<{ date: string | null; count: number; isToday: boolean }> = [];

    // Espacios vacíos al inicio
    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, count: 0, isToday: false });
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = dueMap.get(dateStr) || 0;
      const isToday = dateStr === todayKey();
      days.push({ date: dateStr, count, isToday });
    }

    return { days, monthName: firstDay.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) };
  }

  const calendar = view === 'calendar' ? generateCalendarDays() : null;

  return (
    <aside className="fichero" aria-label="Agenda de repasos">
      <div className="fichero-front">
        <span className="fichero-plate">Agenda de repasos</span>
        <div className="fichero-controls">
          <button
            className={`view-toggle ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
            title="Vista lista"
            aria-label="Vista lista"
          >
            ☰
          </button>
          <button
            className={`view-toggle ${view === 'calendar' ? 'active' : ''}`}
            onClick={() => setView('calendar')}
            title="Vista calendario"
            aria-label="Vista calendario"
          >
            📅
          </button>
          <span className="fichero-handle"></span>
        </div>
      </div>

      {view === 'list' ? (
        <ul className="agenda-list">
          {entries.length === 0 ? (
            <li className="agenda-empty">
              El cajón está vacío: sin repasos programados más allá de hoy.
            </li>
          ) : (
            entries.map((e) => (
              <li className="agenda-card" key={e.date}>
                <span className="agenda-date">{fmtDate(e.date)}</span>
                <span className="agenda-count">{plural(e.count, 'ficha')}</span>
              </li>
            ))
          )}
        </ul>
      ) : (
        <div className="calendar-view">
          <div className="calendar-header">{calendar?.monthName}</div>
          <div className="calendar-weekdays">
            <span>Dom</span>
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
          </div>
          <div className="calendar-grid">
            {calendar?.days.map((day, idx) => (
              <div
                key={idx}
                className={`calendar-day ${day.date ? 'has-date' : 'empty'} ${day.isToday ? 'today' : ''} ${day.count > 0 ? 'has-reviews' : ''}`}
                title={day.date && day.count > 0 ? `${plural(day.count, 'ficha')}` : ''}
              >
                {day.date && (
                  <>
                    <span className="day-number">{new Date(day.date).getDate()}</span>
                    {day.count > 0 && <span className="day-badge">{day.count}</span>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}