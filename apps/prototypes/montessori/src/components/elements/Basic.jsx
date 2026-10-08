import { itemIcon, itemTitle, shortLine, ITEM_TYPES } from '../../state.js';

// ---------- Vista ICONO ----------
export function Icon({ item }) {
  return (
    <span className="v-icon" aria-hidden="true">
      {itemIcon(item)}
    </span>
  );
}

// ---------- Vista CON NOMBRE ----------
export function Named({ item, timer }) {
  return (
    <div className="v-named">
      <span className="v-named-icon" aria-hidden="true">
        {itemIcon(item)}
      </span>
      <span className="v-named-text">
        <strong>{item.type === 'notes' || item.type === 'file' ? itemTitle(item) : ITEM_TYPES[item.type].label}</strong>
        <span>{shortLine(item, timer)}</span>
      </span>
    </div>
  );
}
