import React, { useId, useState } from 'react';
import './comun.css';

/**
 * Sección que se despliega y se oculta, para las visiones (hereda los colores de la visión donde se pone).
 * Empieza plegada por defecto; el resumen de la cabecera deja ver lo esencial sin abrirla.
 */
export function Desplegable({ titulo, resumen, abiertoInicial = false, testId, children, nivel = 2 }) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const uid = useId();
  const H = `h${nivel}`;
  return (
    <div className="vd" data-testid={testId}>
      <H className="vd-titulo">
        <button type="button" className="vd-cabecera" aria-expanded={abierto} aria-controls={`${uid}-c`} onClick={() => setAbierto(!abierto)}>
          <span className="vd-texto"><span className="vd-nombre">{titulo}</span>{resumen && <span className="vd-resumen">{resumen}</span>}</span>
          <svg className={`vd-flecha${abierto ? ' vd-abierta' : ''}`} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </H>
      {abierto && <div id={`${uid}-c`} className="vd-cuerpo">{children}</div>}
    </div>
  );
}
