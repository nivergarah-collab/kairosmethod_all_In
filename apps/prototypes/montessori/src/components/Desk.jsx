import { useCallback, useEffect, useRef, useState } from 'react';
import { ITEM_TYPES, PAUSES } from '../state.js';
import ItemCard from './ItemCard.jsx';
import ConfigDialog from './ConfigDialog.jsx';
import Backdrop from './Backdrop.jsx';

export default function Desk({ state, phase, dispatch, duePauses = [], elapsed = 0 }) {
  const deskRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [configId, setConfigId] = useState(null);
  const [dropReady, setDropReady] = useState(false); // se arrastra una ficha de la bandeja sobre el escritorio
  const { items, background, template } = state;
  const configItem = items.find((i) => i.id === configId);

  // Aviso hablado (solo lectores de pantalla) cuando se agrega o quita un elemento.
  const [notice, setNotice] = useState('');
  const prevCount = useRef(items.length);
  useEffect(() => {
    const diff = items.length - prevCount.current;
    if (diff === 1) setNotice(`Agregado al escritorio: ${ITEM_TYPES[items[items.length - 1].type].label}`);
    else if (diff === -1) setNotice('Elemento quitado del escritorio');
    prevCount.current = items.length;
  }, [items]);

  const pointToPercent = useCallback((clientX, clientY) => {
    const r = deskRef.current.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * 100,
      y: ((clientY - r.top) / r.height) * 100,
    };
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDropReady(false);
    const itemType = e.dataTransfer.getData('text/plain');
    if (!ITEM_TYPES[itemType]) return;
    const { x, y } = pointToPercent(e.clientX, e.clientY);
    dispatch({ type: 'add', itemType, x, y });
  };

  // Resplandor de las lámparas encendidas, centrado en cada una.
  const lamps = items.filter((i) => i.type === 'lamp' && i.config.on);

  return (
    <section
      ref={deskRef}
      className={`desk tpl-${template} bg-${background}${lamps.length ? ' lit' : ''}${dropReady ? ' drop-ready' : ''}`}
      data-testid="desk"
      data-background={background}
      aria-label="Escritorio"
      onDragOver={(e) => { e.preventDefault(); if (!dropReady) setDropReady(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropReady(false); }}
      onDrop={onDrop}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget || e.target.closest('.backdrop')) setSelected(null);
      }}
    >
      <Backdrop background={background} />
      <p className="sr-only" role="status" aria-live="polite">{notice}</p>
      {lamps.map((l) => (
        <div key={l.id} className="glow" aria-hidden="true" style={{ '--x': `${l.x}%`, '--y': `${l.y}%` }} />
      ))}
      {duePauses.length > 0 && (
        <div className="pause-stack" role="status" aria-live="polite">
          {PAUSES.filter((p) => duePauses.includes(p.id)).map((p) => (
            <div key={p.id} className="pause-card">
              <span aria-hidden="true">{p.icon}</span>
              <p>{p.msg}</p>
              <button type="button" className="mini primary" onClick={() => dispatch({ type: 'pauseAck', id: p.id, elapsed })}>
                Hecho
              </button>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <div className="empty">
          <p className="empty-card">
            <strong>Tu escritorio está vacío.</strong>
            <span>Arrastra algo desde la bandeja de abajo o toca «+».</span>
            {phase === 'prep' && <span className="empty-alt">¿Prefieres partir de una escena? Mira el menú «Ejemplos».</span>}
            <small>Pasa el mouse (o toca) un elemento para ver sus controles.</small>
          </p>
        </div>
      )}
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          phase={phase}
          selected={selected === item.id}
          onSelect={setSelected}
          onConfigure={setConfigId}
          dispatch={dispatch}
          pointToPercent={pointToPercent}
        />
      ))}
      {configItem && (
        <ConfigDialog item={configItem} dispatch={dispatch} onClose={() => setConfigId(null)} />
      )}
    </section>
  );
}
