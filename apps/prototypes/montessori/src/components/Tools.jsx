import { useState } from 'react';
import { PAUSES, PAUSE_OPTIONS } from '../state.js';

const TABS = [
  { id: 'tasks', label: 'Tareas', icon: '✅' },
  { id: 'goals', label: 'Metas', icon: '🎯' },
  { id: 'distractions', label: 'Distracciones', icon: '💭' },
  { id: 'pauses', label: 'Pausas', icon: '☕' },
];

const COPY = {
  tasks: { title: 'Lista de tareas', placeholder: 'Nueva tarea…', empty: 'Aún no hay tareas. Anota lo que quieres terminar en esta sesión.', check: true },
  goals: { title: 'Metas de la sesión', placeholder: 'Nueva meta…', empty: 'Aún no hay metas. ¿Qué quieres lograr al terminar?', check: true },
  distractions: { title: 'Distracciones', placeholder: 'Idea ajena al estudio…', empty: 'Sin distracciones. Si algo se te cruza, anótalo aquí y vuelve a la tarea.', check: false },
};

function ListTab({ id, state, dispatch }) {
  const copy = COPY[id];
  const list = state[id];
  const [draft, setDraft] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    dispatch({ type: 'listAdd', list: id, text: draft });
    setDraft('');
  };
  const done = list.filter((e) => e.done).length;
  return (
    <div className="tool-body">
      <h2>
        {copy.title}
        {copy.check && list.length > 0 && <span className="tool-count"> · {done} de {list.length}</span>}
      </h2>
      <form onSubmit={submit} className="tool-form">
        <input
          aria-label={`${copy.title}: escribe y presiona Enter para agregar`}
          placeholder={copy.placeholder}
          value={draft}
          maxLength={120}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn primary" disabled={!draft.trim()}>
          Agregar
        </button>
      </form>
      {list.length === 0 ? (
        <p className="tool-empty">{copy.empty}</p>
      ) : (
        <ul className="tool-list">
          {list.map((e) => (
            <li key={e.id} className={e.done ? 'done' : ''}>
              {copy.check ? (
                <label className="check">
                  <input type="checkbox" checked={e.done} onChange={() => dispatch({ type: 'listToggle', list: id, id: e.id })} />
                  <span>{e.text}</span>
                </label>
              ) : (
                <span className="bullet">{e.text}</span>
              )}
              <button type="button" className="x" aria-label={`Quitar: ${e.text}`} onClick={() => dispatch({ type: 'listRemove', list: id, id: e.id })}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PausesTab({ state, dispatch, elapsed }) {
  return (
    <div className="tool-body">
      <h2>Pausas</h2>
      <p className="tool-hint">Recordatorios visuales dentro de la página, con el tiempo de la sesión. Sin sonido ni notificaciones.</p>
      <ul className="pause-list">
        {PAUSES.map((p) => (
          <li key={p.id}>
            <span className="pause-icon" aria-hidden="true">{p.icon}</span>
            <label className="field">
              <span>{p.label}</span>
              <select
                value={state.pauses[p.id].every}
                onChange={(e) => dispatch({ type: 'pauseEvery', id: p.id, every: Number(e.target.value), elapsed })}
              >
                {PAUSE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? 'Apagado' : `Cada ${m} min`}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Menú lateral derecho tipo inventario: una tira de ranuras (pestañas) que se despliega.
export default function Tools({ state, dispatch, elapsed, open, setOpen, tab, setTab }) {
  const counts = { tasks: state.tasks.length, goals: state.goals.length, distractions: state.distractions.length, pauses: 0 };
  const pick = (id) => {
    setTab(id);
    setOpen(true);
  };
  // Flechas, Inicio y Fin mueven entre pestañas (patrón de tablist).
  const onTabKeys = (e) => {
    const ids = TABS.map((t) => t.id);
    const cur = ids.indexOf(e.target.closest('[role=tab]')?.id.replace('tab-', ''));
    if (cur < 0) return;
    const move = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    let next = cur;
    if (move) next = (cur + move + ids.length) % ids.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = ids.length - 1;
    else return;
    e.preventDefault();
    pick(ids[next]);
    e.currentTarget.querySelector(`#tab-${ids[next]}`)?.focus();
  };
  return (
    <aside className={`tools${open ? ' open' : ''}`} aria-label="Menú de herramientas">
      <div className="tools-slots">
        <button
          type="button"
          className="tools-toggle"
          aria-expanded={open}
          aria-controls="tools-panel"
          aria-label={open ? 'Cerrar herramientas' : 'Abrir herramientas'}
          title="Herramientas (T)"
          onClick={() => setOpen(!open)}
        >
          <span className="tg-desk">{open ? '›' : '‹'}</span>
          <span className="tg-mob">{open ? '✕' : '🧰'}</span>
        </button>
        <div className="tab-strip" role="tablist" aria-label="Herramientas" aria-orientation="vertical" onKeyDown={onTabKeys}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={open && tab === t.id}
            aria-controls="tools-panel"
            className={`slot${open && tab === t.id ? ' on' : ''}`}
            title={t.label}
            tabIndex={(open ? tab : 'tasks') === t.id ? 0 : -1}
            onClick={() => pick(t.id)}
          >
            <span className="slot-icon" aria-hidden="true">{t.icon}</span>
            <span className="slot-label">{t.label}</span>
            {counts[t.id] > 0 && <i className="slot-badge" aria-label={`${counts[t.id]} anotadas`}>{counts[t.id]}</i>}
          </button>
        ))}
        </div>
      </div>
      {open && (
        <div id="tools-panel" className="tools-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === 'pauses' ? (
            <PausesTab state={state} dispatch={dispatch} elapsed={elapsed} />
          ) : (
            <ListTab key={tab} id={tab} state={state} dispatch={dispatch} />
          )}
        </div>
      )}
    </aside>
  );
}
