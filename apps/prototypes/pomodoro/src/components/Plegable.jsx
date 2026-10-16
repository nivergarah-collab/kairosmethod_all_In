import React, { useId, useState } from 'react';
import { Card, T } from '../m3.jsx';
import './plegable.css';

/**
 * Tarjeta con cabecera que se despliega y se oculta (botón con aria-expanded). Empieza plegada y la
 * cabecera muestra un resumen del estado actual, para ahorrar espacio sin esconder lo que está activo.
 */
export function Plegable({ titulo, resumen, icono, testId, toggleTestId, abiertoInicial = false, children, tour }) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const uid = useId();
  return (
    <Card testId={testId} tour={tour} color="var(--surface)" radius={16} style={{ width: '100%', border: '1px solid var(--outline-variant)' }}>
      <button type="button" className="plg-cabecera" aria-expanded={abierto} aria-controls={`${uid}-cuerpo`} onClick={() => setAbierto(!abierto)} data-testid={toggleTestId}>
        {icono}
        <span className="plg-texto">
          <T v="titleSmall" w="bold">{titulo}</T>
          {resumen && <T v="bodySmall" color="var(--on-surface-variant)">{resumen}</T>}
        </span>
        <svg className={`plg-flecha${abierto ? ' plg-abierta' : ''}`} width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {abierto && <div id={`${uid}-cuerpo`} className="plg-cuerpo">{children}</div>}
    </Card>
  );
}
