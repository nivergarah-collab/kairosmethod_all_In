import React from 'react';
import './comun.css';

/** Estado en texto (no solo color) de un bloque según el contrato. */
export function estadoDeBloque(b, currentBlockIndex, currentPhase) {
  if (b.isCompleted) return 'Hecho';
  if (b.index === currentBlockIndex && currentPhase === 'FOCUS') return 'En curso';
  if (b.index === currentBlockIndex + 1 && currentPhase !== 'FOCUS') return 'Sigue';
  return 'Por hacer';
}

/**
 * Lista de todos los bloques de la sesión con su contenido (meta) y su estado: hechos, el actual y los que faltan.
 * `onToggle(index)` permite marcar un bloque como hecho o deshacerlo, igual que en las otras visiones.
 */
export function ListaBloques({ blocks, currentBlockIndex, currentPhase, onToggle, etiquetaBloque = 'Bloque' }) {
  return (
    <ol className="vl">
      {blocks.map((b) => {
        const estado = estadoDeBloque(b, currentBlockIndex, currentPhase);
        const actual = estado === 'En curso' || estado === 'Sigue';
        return (
          <li key={b.index} className={`vl-item${b.isCompleted ? ' vl-hecho' : ''}${actual ? ' vl-actual' : ''}`} aria-current={estado === 'En curso' ? 'step' : undefined}>
            <label className="vl-etiqueta">
              <input type="checkbox" checked={b.isCompleted} onChange={() => onToggle(b.index)} />
              <span className="vl-texto">
                <span className="vl-meta">{etiquetaBloque} {b.index} · {estado}</span>
                <span className="vl-goal">{b.goal}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ol>
  );
}
