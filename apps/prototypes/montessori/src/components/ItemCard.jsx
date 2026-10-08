import { memo } from 'react';
import { ITEM_TYPES, VIEWS, VIEW_LABELS, SIZE_LABELS, itemTitle } from '../state.js';
import { Icon, Named, Live, dims } from './elements/index.jsx';
import useCountdown from './useCountdown.js';

const INTERACTIVE = 'button, input, textarea, select, [data-nodrag]';

function ItemCard({
  item, phase, selected, onSelect, onConfigure, dispatch, pointToPercent,
}) {
  const def = ITEM_TYPES[item.type];
  const timer = useCountdown(item.type === 'timer' ? item.config.minutes * 60 : 0, item.type === 'timer');
  const [w, h] = dims(item);
  const prep = phase === 'prep';

  // Mover arrastrando el propio elemento (menos sus controles). Con umbral de 4 px para
  // que un toque simple no lo desplace.
  const startMove = (e) => {
    onSelect(item.id);
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest(INTERACTIVE)) return;
    const el = e.currentTarget;
    const sx = e.clientX;
    const sy = e.clientY;
    let moving = false;
    el.setPointerCapture?.(e.pointerId);
    const move = (ev) => {
      if (!moving && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
      moving = true;
      const { x, y } = pointToPercent(ev.clientX, ev.clientY);
      dispatch({ type: 'move', id: item.id, x, y });
    };
    const end = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  };

  const onKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    const step = e.shiftKey ? 5 : 2;
    const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfigure(item.id);
    } else if (e.key === 'v' || e.key === 'V') {
      dispatch({ type: 'cycleView', id: item.id });
    } else if (e.key === 's' || e.key === 'S') {
      dispatch({ type: 'toggleSize', id: item.id });
    } else if (e.key === 'Delete') {
      dispatch({ type: 'remove', id: item.id });
    } else if (arrows[e.key]) {
      e.preventDefault();
      const [dx, dy] = arrows[e.key];
      dispatch({ type: 'move', id: item.id, x: item.x + dx, y: item.y + dy });
    }
  };

  const onDoubleClick = (e) => {
    if (e.target.closest('textarea, input, select')) return;
    onConfigure(item.id);
  };

  const title = itemTitle(item);
  const nextView = VIEWS[(VIEWS.indexOf(item.view) + 1) % VIEWS.length];
  const sizeLabel = SIZE_LABELS[item.size];

  return (
    <article
      className={`item item-${item.type} view-${item.view} size-${item.size}${prep && item.done ? ' done' : ''}${selected ? ' selected' : ''}${item.y < 28 ? ' bar-below' : ''}`}
      data-testid="item"
      data-type={item.type}
      data-view={item.view}
      data-size={item.size}
      tabIndex={0}
      aria-label={`${title}. Vista ${VIEW_LABELS[item.view].toLowerCase()}, tamaño ${sizeLabel.toLowerCase()}${prep && item.done ? ', listo' : ''}. Enter configura; flechas mueven; V cambia la vista; S cambia el tamaño; Supr quita.`}
      style={{ '--x': `${item.x}%`, '--y': `${item.y}%`, '--w': w, '--h': h, '--rot': `${((item.id * 7) % 5 - 2) * 0.9}deg` }}
      onPointerDown={startMove}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
    >
      <div className="surface" key={item.view}>
        {item.view === 'icon' && <Icon item={item} />}
        {item.view === 'named' && <Named item={item} timer={timer} />}
        {item.view === 'live' && <Live item={item} timer={timer} dispatch={dispatch} />}
      </div>

      {prep && item.done && (
        <span className="tick" aria-hidden="true">
          ✓
        </span>
      )}

      <div className="bar" role="toolbar" aria-label={`Controles de ${title}`}>
        {prep && (
          <button
            type="button"
            aria-pressed={item.done}
            title="Marcar como listo"
            onClick={() => dispatch({ type: 'toggle', id: item.id })}
          >
            <span aria-hidden="true">✓</span>
            <b>Listo</b>
          </button>
        )}
        <button
          type="button"
          title={`Vista: ${VIEW_LABELS[item.view]}. Cambiar a ${VIEW_LABELS[nextView]}`}
          onClick={() => dispatch({ type: 'cycleView', id: item.id })}
        >
          <span aria-hidden="true">👁</span>
          <b>Vista</b>
        </button>
        <button
          type="button"
          title={`Tamaño: ${sizeLabel}. Cambiar a ${item.size === 'main' ? 'secundario' : 'principal'}`}
          onClick={() => dispatch({ type: 'toggleSize', id: item.id })}
        >
          <span aria-hidden="true">⤢</span>
          <b>Tamaño</b>
        </button>
        <button type="button" title="Configurar" onClick={() => onConfigure(item.id)}>
          <span aria-hidden="true">⚙</span>
          <b>Configurar</b>
        </button>
        <button
          type="button"
          className="danger"
          title={`Quitar ${def.label}`}
          aria-label={`Quitar ${title}`}
          onClick={() => dispatch({ type: 'remove', id: item.id })}
        >
          <span aria-hidden="true">✕</span>
          <b>Quitar</b>
        </button>
      </div>
    </article>
  );
}

// Memoizada: el reloj de la sesión re-renderiza el escritorio cada segundo, y las tarjetas
// solo deben repintarse cuando cambia su propio elemento.
export default memo(ItemCard);
