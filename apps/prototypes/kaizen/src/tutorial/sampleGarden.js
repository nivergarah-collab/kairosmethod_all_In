// Jardín de ejemplo solo en memoria para el recorrido. Nunca se guarda ni se mezcla con los datos del usuario.
import { createInitialGarden, createPlant } from '../state.js';
import { prepareGarden } from '../scene.js';
import { localDayKey, shiftDayKey } from '../time.js';

const SAMPLE_PLANTS = [
  { id: 'tour-resumir', familyId: 'comprender', approachId: 'resumir', name: 'Un resumen breve', action: 'Resumir en tres líneas lo que acabo de estudiar.', growthPoints: 24, moment: 'Después de estudiar', place: 'En mi escritorio' },
  { id: 'tour-imitar', familyId: 'practicar', approachId: 'imitar', name: 'Seguir un ejemplo', action: 'Resolver un ejemplo siguiendo un modelo.', growthPoints: 12, moment: '', place: '' },
  { id: 'tour-recordar', familyId: 'reflexionar', approachId: 'recordar', name: 'Traer una idea a la memoria', action: 'Recordar una idea clave antes de revisar mis apuntes.', growthPoints: 3, moment: '', place: '' },
];

export const TOUR_PLANT_ID = SAMPLE_PLANTS[0].id;

function buildPlant(spec, now) {
  const plant = createPlant({
    id: spec.id, familyId: spec.familyId, approachId: spec.approachId, name: spec.name, action: spec.action,
    cue: { moment: spec.moment, place: spec.place }, now,
  });
  const today = localDayKey(now);
  const history = [3, 2].slice(0, spec.growthPoints > 3 ? 2 : 1).map((back) => ({ type: 'care', dayKey: shiftDayKey(today, -back) }));
  return { ...plant, growthPoints: spec.growthPoints, level: Math.floor(spec.growthPoints / 7) + 1, history };
}

// variant 'plants': tres plantas y una entrada de herbario. variant 'empty': jardín vacío (muestra la elección de semilla).
export function createTutorialGarden(variant = 'plants', now = new Date()) {
  const base = prepareGarden(createInitialGarden({ now }));
  if (variant === 'empty') return base;
  const plants = SAMPLE_PLANTS.map((spec) => buildPlant(spec, now));
  const frozen = {
    ...buildPlant({ id: 'tour-herbario', familyId: 'practicar', approachId: 'completar', name: 'Completar un paso', action: 'Completar un paso de un ejercicio sin mirar la solución.', growthPoints: 8, moment: '', place: '' }, now),
    status: 'frozen',
    frozenAt: now.toISOString(),
  };
  return prepareGarden({ ...base, plants, herbarium: [frozen] });
}
