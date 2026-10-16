import React from 'react';
import { ActiveTimerScreen } from '../../screens/ActiveTimerScreen.jsx';
import { useTemaVision } from '../tema/TemaVision.jsx';

// Visión Paridad: la presentación base, copia fiel de la app Android PomoStudy
// (prototipo «pomodoro-paridad»). Es la única visión sin etiqueta «Visión: …».
// Las demás visiones son capas alternativas sobre el mismo contrato de sesión.
// Su panel «Colores» pisa los roles de color solo dentro de este contenedor.
export function ParidadView() {
  const tema = useTemaVision('paridad');
  return (
    <div className="pr-colores" style={{ ...tema.vars, display: 'contents' }} data-testid="vision_paridad">
      {tema.panel}
      <ActiveTimerScreen />
    </div>
  );
}
