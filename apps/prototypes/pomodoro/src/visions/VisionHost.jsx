import React from 'react';
import { ActiveTimerScreen } from '../screens/ActiveTimerScreen.jsx';
import { CalmaView } from './calma/CalmaView.jsx';
import { VisionView } from './vision/VisionView.jsx';
import { ParidadView } from './paridad/ParidadView.jsx';
import { InvestigacionView } from './investigacion/InvestigacionView.jsx';
import { PomodoroView } from './pomodoro/PomodoroView.jsx';
import { getVision } from './registry.js';
import { useVM } from '../useStore.jsx';
import './review.css';

// Cada visión es una capa de presentación sobre el contrato. Las que aún no tienen capa propia
// usan la presentación base (Paridad) y lo dicen en una etiqueta.
const VIEWS = {
  calma: CalmaView,
  vision: VisionView,
  paridad: ParidadView,
  investigacion: InvestigacionView,
  pomodoro: PomodoroView,
};

function Vista({ vision }) {
  const View = VIEWS[vision];
  if (View) return <View />;
  return <ActiveTimerScreen visionName={getVision(vision).name} />;
}

export function VisionHost({ vision }) {
  const { state, vm } = useVM();
  if (!state.isReviewing) return <Vista vision={vision} />;
  // Revisión de una sesión guardada: la visión se ve completa pero inerte (solo lectura); el aviso y «Cerrar» quedan fuera.
  return (
    <>
      <div className="rv-aviso" role="status" data-testid="review_banner">
        <p><strong>Sesión guardada, solo lectura.</strong> Estás viéndola con la visión {getVision(vision).name}; los controles no cambian nada.</p>
        <button type="button" className="rv-cerrar" onClick={() => vm.closeReview()} data-testid="review_close">Cerrar y volver al historial</button>
      </div>
      <div inert="" data-testid="review_view"><Vista vision={vision} /></div>
    </>
  );
}
