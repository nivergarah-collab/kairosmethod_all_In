import { useEffect, useRef } from 'react';
import { itemIcon, itemTitle, ITEM_TYPES } from '../state.js';
import ConfigForm from './ConfigForm.jsx';

// Configuración de un elemento. Se abre con doble clic/toque, Enter o el botón de la barrita.
export default function ConfigDialog({ item, dispatch, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    const first = ref.current?.querySelector('input, select, textarea, button');
    first?.focus();
    return () => prev?.focus?.();
  }, []);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    } else if (e.key === 'Tab') {
      // El foco queda dentro del diálogo.
      const f = [...ref.current.querySelectorAll('input, select, textarea, button')].filter((n) => !n.disabled);
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Configurar ${ITEM_TYPES[item.type].label}`}
        onKeyDown={onKeyDown}
      >
        <header>
          <h2>
            <span aria-hidden="true" className="dlg-icon">{itemIcon(item)}</span>
            Configurar · {itemTitle(item)}
          </h2>
        </header>
        <ConfigForm item={item} dispatch={dispatch} />
        <footer>
          <button type="button" className="btn primary" onClick={onClose}>
            Listo, cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
