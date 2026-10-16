import React, { useEffect, useRef } from 'react';
import { VISIONS, moveIndex } from '../visions/registry.js';
import { VisionPreview } from '../visions/VisionPreview.jsx';
import './vision-picker.css';

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Selector de visión: ventana emergente accesible (role="dialog" aria-modal).
 * Foco atrapado, Escape cierra, flechas mueven entre opciones, Enter/Espacio eligen,
 * y al cerrar el foco vuelve al elemento que la abrió.
 */
export function VisionPickerDialog({ onChoose, onDismiss, initialVision = null, mode = 'start' }) {
  const repaso = mode === 'review';
  const dialogRef = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    const opener = document.activeElement;
    const start = Math.max(0, VISIONS.findIndex((v) => v.id === initialVision));
    optionRefs.current[start]?.focus();
    return () => {
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    };
  }, [initialVision]);

  const columns = () => {
    const first = optionRefs.current[0];
    if (!first) return 1;
    return optionRefs.current.filter((el) => el && el.offsetTop === first.offsetTop).length || 1;
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      onDismiss();
      return;
    }
    if (e.key === 'Tab') {
      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      const current = optionRefs.current.findIndex((el) => el === document.activeElement);
      if (current < 0) return;
      e.preventDefault();
      optionRefs.current[moveIndex(current, e.key, VISIONS.length, columns())]?.focus();
    }
  };

  return (
    <div className="vp-scrim" onMouseDown={(e) => e.target === e.currentTarget && onDismiss()}>
      <div ref={dialogRef} className="vp-dialog" role="dialog" aria-modal="true" aria-labelledby="vp-title" aria-describedby="vp-desc" data-testid="vision_picker" onKeyDown={onKeyDown}>
        <div className="vp-head">
          <h2 id="vp-title" className="vp-title">{repaso ? 'Elige cómo ver esta sesión guardada' : 'Elige cómo ver tu sesión'}</h2>
          <button type="button" className="vp-close" onClick={onDismiss} aria-label={repaso ? 'Cerrar sin abrir' : 'Cerrar sin iniciar'}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <p id="vp-desc" className="vp-desc">{repaso ? 'La sesión se guardó sin visión: cualquiera sirve para repasarla. Se abre en solo lectura y no cambia tu registro.' : 'Todas las visiones usan los mismos datos: puedes cambiar de visión en otra sesión sin perder nada.'}</p>
        <ul className="vp-grid">
          {VISIONS.map((v, i) => (
            <li key={v.id}>
              <button
                type="button"
                ref={(el) => { optionRefs.current[i] = el; }}
                className="vp-option"
                onClick={() => onChoose(v.id)}
                data-testid={`vision_option_${v.id}`}
              >
                <span className="vp-thumb"><VisionPreview vision={v} /></span>
                <span className="vp-name">{v.name}</span>
                <span className="vp-tag">{v.tagline}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
