import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FAMILIES,
  createInitialGarden,
  createPlant,
  careForPlant,
  canUnlockNursery,
  getActivePlants,
  getHerbarium,
  reduceGarden,
  replicatePlant,
  rollGardenTo,
  simulateHealthyWeek,
  simulateRecovery,
} from './state.js';
import { localDayKey, shiftDayKey } from './time.js';

const now = new Date('2026-10-08T12:00:00.000Z');

function starter(garden, familyId, approachId) {
  return reduceGarden(garden, { type: 'SELECT_STARTER_PLANT', familyId, approachId, now });
}

test('el jardín inicial está versionado, vacío y serializable', () => {
  const garden = createInitialGarden({ now });

  assert.equal(garden.version, 1);
  assert.equal(garden.onboardingComplete, false);
  assert.deepEqual(garden.plants, []);
  assert.deepEqual(garden.herbarium, []);
  assert.deepEqual(garden.history, []);
  assert.equal(garden.clockMode, 'real');
  assert.equal(garden.virtualDate, null);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(garden)));
});

test('las tres familias y sus enfoques forman configuración serializable', () => {
  assert.deepEqual(FAMILIES.map(({ id }) => id), ['comprender', 'practicar', 'reflexionar']);
  assert.deepEqual(FAMILIES.map(({ approaches }) => approaches.map(({ id }) => id)), [
    ['resumir', 'comparar', 'explicar'],
    ['imitar', 'completar', 'corregir'],
    ['recordar', 'evaluar', 'ajustar'],
  ]);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(FAMILIES)));
});

test('crear una planta valida el enfoque y conserva una microacción observable', () => {
  const plant = createPlant({
    id: 'plant-1',
    familyId: 'practicar',
    approachId: 'imitar',
    name: 'Un ejemplo guiado',
    action: 'Resolver un ejemplo siguiendo un modelo.',
    frequency: 'daily',
    cue: { moment: 'después de clases', place: 'en mi escritorio' },
    now,
  });

  assert.equal(plant.id, 'plant-1');
  assert.equal(plant.health, 100);
  assert.equal(plant.growthPoints, 0);
  assert.equal(plant.status, 'active');
  assert.equal(plant.createdAt, now.toISOString());
  assert.deepEqual(plant.cue, { moment: 'después de clases', place: 'en mi escritorio' });
});

test('elegir una semilla por familia completa onboarding sin duplicar selecciones', () => {
  let garden = createInitialGarden({ now });
  garden = starter(garden, 'comprender', 'resumir');
  garden = starter(garden, 'comprender', 'resumir');
  garden = starter(garden, 'practicar', 'imitar');
  garden = starter(garden, 'reflexionar', 'recordar');

  assert.equal(garden.onboardingComplete, true);
  assert.equal(getActivePlants(garden).length, 3);
  assert.deepEqual(new Set(garden.plants.map(({ familyId }) => familyId)), new Set(['comprender', 'practicar', 'reflexionar']));
});

test('editar una microacción conserva los puntos de crecimiento y el historial', () => {
  const initial = createInitialGarden({ now });
  const plant = createPlant({
    id: 'plant-edit', familyId: 'comprender', approachId: 'explicar',
    name: 'Explicar una idea', action: 'Explicar una idea con mis palabras.', now,
  });
  const grownPlant = { ...plant, growthPoints: 17, health: 85, history: [{ type: 'care', dayKey: '2026-10-07' }] };
  const garden = { ...initial, plants: [grownPlant] };

  const edited = reduceGarden(garden, {
    type: 'EDIT_PLANT', plantId: grownPlant.id,
    changes: { action: 'Explicar una idea en dos frases.' }, now,
  });

  assert.equal(edited.plants[0].action, 'Explicar una idea en dos frases.');
  assert.equal(edited.plants[0].growthPoints, 17);
  assert.equal(edited.plants[0].health, 85);
  assert.deepEqual(edited.plants[0].history, grownPlant.history);
});

test('congelar mueve la planta al herbario y un jardín nuevo empieza vacío', () => {
  let garden = starter(createInitialGarden({ now }), 'reflexionar', 'ajustar');
  const [plant] = garden.plants;
  const grownPlant = { ...plant, growthPoints: 12, history: [{ type: 'care', dayKey: '2026-10-07' }] };
  garden = { ...garden, plants: [grownPlant] };

  const frozen = reduceGarden(garden, { type: 'FREEZE_PLANT', plantId: plant.id, now });

  assert.equal(getActivePlants(frozen).length, 0);
  assert.equal(getHerbarium(frozen).length, 1);
  assert.equal(getHerbarium(frozen)[0].status, 'frozen');
  assert.equal(getHerbarium(frozen)[0].growthPoints, 12);
  assert.deepEqual(getHerbarium(frozen)[0].history, grownPlant.history);
  assert.equal(frozen.history.at(-1).type, 'plant-frozen');

  const fresh = reduceGarden(frozen, { type: 'NEW_GARDEN', now });
  assert.equal(fresh.onboardingComplete, false);
  assert.deepEqual(fresh.plants, []);
  assert.deepEqual(fresh.herbarium, []);
});

test('creación rechaza familias, acciones, textos y frecuencias no válidas', () => {
  const valid = {
    familyId: 'comprender', approachId: 'comparar',
    name: 'Comparar ideas', action: 'Anotar una similitud entre dos ideas.', now,
  };

  assert.throws(() => createPlant({ ...valid, familyId: 'descansar' }), /familia/i);
  assert.throws(() => createPlant({ ...valid, approachId: 'imitar' }), /enfoque/i);
  assert.throws(() => createPlant({ ...valid, name: '  ' }), /nombre/i);
  assert.throws(() => createPlant({ ...valid, action: '' }), /microacción/i);
  assert.throws(() => createPlant({ ...valid, frequency: 'hourly' }), /frecuencia/i);
  assert.throws(() => createPlant({ ...valid, now: 'fecha inválida' }), /fecha/i);
});

test('el reducer rechaza plantas con salud o crecimiento fuera de rango', () => {
  const plant = createPlant({
    id: 'plant-range', familyId: 'practicar', approachId: 'corregir',
    name: 'Corregir un error', action: 'Corregir un error pequeño.', now,
  });
  const garden = createInitialGarden({ now });

  assert.throws(() => reduceGarden({ ...garden, plants: [{ ...plant, health: 101 }] }, { type: 'UNKNOWN' }), /salud/i);
  assert.throws(() => reduceGarden({ ...garden, plants: [{ ...plant, growthPoints: -1 }] }, { type: 'UNKNOWN' }), /crecimiento/i);
});

test('el reducer rechaza una fecha de cuidado inválida', () => {
  const plant = createPlant({
    id: 'plant-invalid-day', familyId: 'comprender', approachId: 'resumir',
    name: 'Un resumen breve', action: 'Resumir una idea en tres líneas.', now,
  });
  const garden = { ...createInitialGarden({ now }), plants: [{ ...plant, lastCareDay: '2026-02-30' }] };

  assert.throws(() => reduceGarden(garden, { type: 'UNKNOWN' }), /fecha/i);
});

test('el cuidado diario es idempotente, recupera salud y suma crecimiento', () => {
  const plant = createPlant({
    id: 'plant-care', familyId: 'comprender', approachId: 'resumir',
    name: 'Un resumen breve', action: 'Resumir una idea en tres líneas.', now,
  });
  const garden = { ...createInitialGarden({ now }), plants: [plant] };
  const dayKey = localDayKey(now);

  const cared = careForPlant(garden, plant.id, dayKey);
  const repeated = careForPlant(cared, plant.id, dayKey);

  assert.equal(cared.plants[0].growthPoints, 1);
  assert.equal(cared.plants[0].health, 100);
  assert.equal(cared.plants[0].history.filter(({ type }) => type === 'care').length, 1);
  assert.deepEqual(repeated, cared);
});

test('establecer una planta registra el hito una sola vez al cruzar 21 cuidados', () => {
  const plant = createPlant({
    id: 'plant-milestone', familyId: 'comprender', approachId: 'resumir',
    name: 'Un resumen breve', action: 'Resumir una idea en tres líneas.', now,
  });
  const garden = { ...createInitialGarden({ now }), plants: [{ ...plant, growthPoints: 20, level: 3 }] };
  const firstDay = localDayKey(now);

  const established = careForPlant(garden, plant.id, firstDay);
  const later = careForPlant(established, plant.id, shiftDayKey(firstDay, 1));
  const milestones = later.plants[0].history.filter(({ type }) => type === 'plant-evolved');

  assert.equal(established.plants[0].growthPoints, 21);
  assert.deepEqual(milestones, [{
    type: 'plant-evolved', dayKey: firstDay, growthPoints: 21, milestone: 'established',
  }]);
  assert.deepEqual(established.history.filter(({ type }) => type === 'plant-evolved'), [{
    type: 'plant-evolved', dayKey: firstDay, growthPoints: 21, milestone: 'established', plantId: plant.id,
  }]);
  assert.equal(later.plants[0].growthPoints, 22);
  assert.equal(later.history.filter(({ type }) => type === 'plant-evolved').length, 1);
});

test('al llegar al nivel cinco propone trasplantar y conserva el macetero mayor', () => {
  const plant = createPlant({
    id: 'plant-repot', familyId: 'comprender', approachId: 'resumir',
    name: 'Un resumen breve', action: 'Resumir una idea en tres líneas.', now,
  });
  const garden = { ...createInitialGarden({ now }), plants: [{ ...plant, growthPoints: 27, level: 4 }] };
  const firstDay = localDayKey(now);
  assert.deepEqual(reduceGarden(garden, { type: 'REPOT_PLANT', plantId: plant.id, dayKey: firstDay }), garden);
  const ready = careForPlant(garden, plant.id, firstDay);

  assert.equal(ready.plants[0].growthPoints, 28);
  assert.equal(ready.plants[0].level, 5);
  assert.equal(ready.plants[0].potStage, 1);
  assert.deepEqual(ready.history.filter(({ type }) => type === 'plant-repot-ready'), [{
    type: 'plant-repot-ready', dayKey: firstDay, growthPoints: 28, plantId: plant.id,
  }]);

  const repotted = reduceGarden(ready, { type: 'REPOT_PLANT', plantId: plant.id, dayKey: firstDay });
  const paused = rollGardenTo(repotted, shiftDayKey(firstDay, 2));
  const repeated = reduceGarden(paused, { type: 'REPOT_PLANT', plantId: plant.id, dayKey: shiftDayKey(firstDay, 2) });

  assert.equal(repotted.plants[0].potStage, 2);
  assert.equal(paused.plants[0].potStage, 2);
  assert.deepEqual(repotted.history.filter(({ type }) => type === 'plant-repotted'), [{
    type: 'plant-repotted', dayKey: firstDay, growthPoints: 28, potStage: 2, plantId: plant.id,
  }]);
  assert.deepEqual(repeated, paused);
  const frozen = reduceGarden(paused, { type: 'FREEZE_PLANT', plantId: plant.id, now: new Date('2026-10-10T12:00:00Z') });
  const replica = replicatePlant(frozen, plant.id, new Date('2026-10-11T12:00:00Z'));
  assert.equal(replica.plants[0].potStage, 2);
});

test('una omisión no baja salud y dos omisiones consecutivas restan diez puntos', () => {
  const plant = createPlant({
    id: 'plant-miss', familyId: 'practicar', approachId: 'completar',
    name: 'Completar un paso', action: 'Completar un paso sin mirar la solución.', now,
  });
  const garden = { ...createInitialGarden({ now }), plants: [plant] };
  const start = localDayKey(now);
  const afterOneMiss = rollGardenTo(garden, shiftDayKey(start, 1));
  const repeated = rollGardenTo(afterOneMiss, shiftDayKey(start, 1));
  const afterTwoMisses = rollGardenTo(repeated, shiftDayKey(start, 2));

  assert.equal(afterOneMiss.plants[0].health, 100);
  assert.equal(afterOneMiss.plants[0].consecutiveMisses, 1);
  assert.equal(repeated.plants[0].history.length, afterOneMiss.plants[0].history.length);
  assert.equal(afterTwoMisses.plants[0].health, 90);
  assert.equal(afterTwoMisses.plants[0].consecutiveMisses, 2);
  assert.equal(afterTwoMisses.plants[0].growthPoints, 0);
});

test('el cuidado después de fallar recupera cinco puntos y no revierte crecimiento', () => {
  const plant = createPlant({
    id: 'plant-recover', familyId: 'reflexionar', approachId: 'evaluar',
    name: 'Revisar comprensión', action: 'Valorar qué entendí mejor.', now,
  });
  const garden = { ...createInitialGarden({ now }), plants: [{ ...plant, health: 70, growthPoints: 4, consecutiveMisses: 2 }] };
  const dayKey = shiftDayKey(localDayKey(now), 1);

  const recovered = careForPlant(garden, plant.id, dayKey);

  assert.equal(recovered.plants[0].health, 75);
  assert.equal(recovered.plants[0].growthPoints, 5);
  assert.equal(recovered.plants[0].consecutiveMisses, 0);
});

test('salud nunca supera cien ni baja de cero', () => {
  const plant = createPlant({
    id: 'plant-bounds', familyId: 'practicar', approachId: 'corregir',
    name: 'Corregir un error', action: 'Corregir un error pequeño.', now,
  });
  const garden = createInitialGarden({ now });
  const day = localDayKey(now);
  const almostFull = { ...garden, plants: [{ ...plant, health: 98 }] };
  const recovered = careForPlant(almostFull, plant.id, day);
  const fragile = { ...garden, plants: [{ ...plant, health: 5 }] };
  const depleted = rollGardenTo(fragile, shiftDayKey(day, 2));

  assert.equal(recovered.plants[0].health, 100);
  assert.equal(depleted.plants[0].health, 0);
  assert.equal(depleted.plants[0].status, 'active');
});

test('las simulaciones demo avanzan sin cambiar el reloj del sistema', () => {
  const plant = createPlant({
    id: 'plant-demo', familyId: 'comprender', approachId: 'explicar',
    name: 'Explicar una idea', action: 'Explicar una idea con mis palabras.', now,
  });
  const garden = { ...createInitialGarden({ now }), plants: [plant] };

  const week = simulateHealthyWeek(garden, now);
  const recovery = simulateRecovery(garden, now);

  assert.equal(week.clockMode, 'demo');
  assert.equal(week.plants[0].growthPoints, 7);
  assert.equal(week.plants[0].consecutiveMisses, 0);
  assert.equal(week.virtualDate, shiftDayKey(localDayKey(now), 7));
  assert.equal(recovery.clockMode, 'demo');
  assert.equal(recovery.plants[0].health, 95);
  assert.equal(recovery.plants[0].growthPoints, 1);
});

test('la semana demo cuida cada planta del jardín en todos los días', () => {
  const first = createPlant({
    id: 'plant-week-one', familyId: 'comprender', approachId: 'resumir',
    name: 'Un resumen breve', action: 'Resumir una idea en tres líneas.', now,
  });
  const second = createPlant({
    id: 'plant-week-two', familyId: 'practicar', approachId: 'imitar',
    name: 'Seguir un ejemplo', action: 'Resolver un ejemplo guiado.', now,
  });
  const garden = { ...createInitialGarden({ now }), plants: [first, second] };
  const week = simulateHealthyWeek(garden, now);

  assert.deepEqual(week.plants.map(({ growthPoints }) => growthPoints), [7, 7]);
});

test('cada planta registra su propia omisión aunque otra se cuide antes', () => {
  const first = createPlant({
    id: 'plant-staggered-one', familyId: 'comprender', approachId: 'resumir',
    name: 'Un resumen breve', action: 'Resumir una idea en tres líneas.', now,
  });
  const second = createPlant({
    id: 'plant-staggered-two', familyId: 'practicar', approachId: 'imitar',
    name: 'Seguir un ejemplo', action: 'Resolver un ejemplo guiado.', now,
  });
  const garden = { ...createInitialGarden({ now }), plants: [first, second] };
  const start = localDayKey(now);
  const afterFirstCare = careForPlant(garden, first.id, start);
  const afterSecondCare = careForPlant(afterFirstCare, second.id, shiftDayKey(start, 1));
  const secondHistory = afterSecondCare.plants.find(({ id }) => id === second.id).history;

  assert.ok(secondHistory.some((event) => event.type === 'miss' && event.dayKey === start));
  assert.equal(afterSecondCare.plants.find(({ id }) => id === second.id).health, 100);
  assert.equal(afterSecondCare.plants.find(({ id }) => id === second.id).consecutiveMisses, 0);
});

test('una semana saludable habilita el vivero provisional', () => {
  let garden = createInitialGarden({ now });
  for (const family of FAMILIES) garden = starter(garden, family.id, family.approaches[0].id);

  assert.equal(canUnlockNursery(garden), false);
  const nextDay = reduceGarden(garden, { type: 'ADVANCE_DEMO', days: 1, now });
  const week = simulateHealthyWeek(nextDay, now);
  assert.equal(canUnlockNursery(week), true);
  const extended = reduceGarden(week, {
    type: 'ADD_PLANT',
    input: { familyId: 'reflexionar', approachId: 'ajustar', name: 'Nuevo brote', action: 'Elegir una pregunta nueva.' },
    now: new Date('2026-10-16T12:00:00.000Z'),
  });
  assert.equal(canUnlockNursery(extended), true);
});

test('los controles del reloj demo avanzan y vuelven al día real sin cambiar el reloj del sistema', () => {
  let garden = createInitialGarden({ now });
  garden = starter(garden, 'comprender', 'resumir');
  const startDay = localDayKey(now);
  const advanced = reduceGarden(garden, { type: 'ADVANCE_DEMO', days: 1, now });
  assert.equal(advanced.clockMode, 'demo');
  assert.equal(advanced.virtualDate, shiftDayKey(startDay, 1));
  const today = reduceGarden(advanced, { type: 'RETURN_TO_TODAY', now });
  assert.equal(today.clockMode, 'real');
  assert.equal(today.virtualDate, null);
  assert.equal(today.lastProcessedDay, shiftDayKey(startDay, -1));
  assert.equal(today.plants[0].lastCareDay, null);
});

test('replicar desde el herbario crea una semilla nueva con 80% del crecimiento y el mismo nivel', () => {
  let garden = createInitialGarden({ now });
  garden = starter(garden, 'comprender', 'resumir');
  const original = garden.plants[0];
  for (let offset = 0; offset < 14; offset += 1) {
    garden = careForPlant(garden, original.id, shiftDayKey('2026-10-08', offset));
  }
  garden = reduceGarden(garden, { type: 'FREEZE_PLANT', plantId: original.id, now: new Date('2026-10-22T12:00:00Z') });

  const replicated = replicatePlant(garden, original.id, new Date('2026-10-23T12:00:00Z'));
  assert.equal(replicated.herbarium.length, 1);
  assert.equal(replicated.plants.length, 1);
  assert.notEqual(replicated.plants[0].id, original.id);
  assert.equal(replicated.plants[0].growthPoints, Math.floor(garden.herbarium[0].growthPoints * 0.8));
  assert.equal(replicated.plants[0].level, garden.herbarium[0].level);
  assert.deepEqual(replicated.plants[0].history, []);
});

test('borrar una entrada del herbario no altera las plantas activas', () => {
  let garden = createInitialGarden({ now });
  for (const family of FAMILIES) garden = starter(garden, family.id, family.approaches[0].id);
  const frozenId = garden.plants[0].id;
  garden = reduceGarden(garden, { type: 'FREEZE_PLANT', plantId: frozenId, now });
  garden = reduceGarden(garden, { type: 'DELETE_HERBARIUM_PLANT', plantId: frozenId, now });

  assert.equal(garden.herbarium.length, 0);
  assert.equal(garden.plants.length, 2);
  assert.ok(garden.plants.every(({ id }) => id !== frozenId));
});

test('congelar conserva el máximo de 500 eventos y guarda el hito más reciente', () => {
  let garden = createInitialGarden({ now });
  garden = starter(garden, 'comprender', 'resumir');
  const plantId = garden.plants[0].id;
  garden = {
    ...garden,
    history: Array.from({ length: 500 }, (_, index) => ({
      type: 'plant-cared', dayKey: '2026-10-08', plantId, sequence: index,
    })),
  };

  const frozen = reduceGarden(garden, { type: 'FREEZE_PLANT', plantId, now });

  assert.equal(frozen.history.length, 500);
  assert.equal(frozen.history.at(-1).type, 'plant-frozen');
  assert.equal(frozen.history[0].sequence, 1);
});

test('seleccionar una semilla conserva el máximo de eventos del jardín', () => {
  const garden = {
    ...createInitialGarden({ now }),
    history: Array.from({ length: 500 }, (_, sequence) => ({
      type: 'legacy-event', at: now.toISOString(), sequence,
    })),
  };

  const started = reduceGarden(garden, {
    type: 'SELECT_STARTER_PLANT', familyId: 'comprender', approachId: 'resumir', now,
  });

  assert.equal(started.history.length, 500);
  assert.equal(started.history[0].sequence, 1);
  assert.equal(started.history.at(-1).type, 'starter-selected');
});
