import { ITEM_TYPES } from '../state.js';

// Posición al agregar con «+» o con un toque: rejilla para que no se tapen entre sí.
const slot = (n) => ({ x: 16 + (n % 4) * 23, y: 24 + (Math.floor(n / 4) % 3) * 24 });

// Bandeja inferior: fila fija con scroll horizontal. Siempre visible, también en sesión.
export default function Tray({ dispatch, count }) {
  const add = (type) => dispatch({ type: 'add', itemType: type, ...slot(count) });
  return (
    <nav className="tray" aria-label="Bandeja de elementos">
      <ul>
        {Object.entries(ITEM_TYPES).map(([type, def]) => (
          <li
            key={type}
            className="tray-item"
            data-type={type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', type);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={(e) => {
              // En pantallas táctiles basta con tocar la ficha para agregar.
              if (!e.target.closest('button') && window.matchMedia('(pointer: coarse)').matches) add(type);
            }}
          >
            <span className="tray-icon" aria-hidden="true">{def.icon}</span>
            <span className="tray-label">{def.label}</span>
            <button type="button" className="add" aria-label={`Agregar ${def.label}`} onClick={() => add(type)}>
              +
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
