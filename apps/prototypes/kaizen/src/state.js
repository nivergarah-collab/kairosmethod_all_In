import { daysBetween, localDayKey, parseDayKey, shiftDayKey } from './time.js';

export const FAMILIES = [
  {
    id: 'comprender',
    label: 'Comprender',
    description: 'Leer las ideas con calma y encontrarles sentido.',
    approaches: [
      { id: 'resumir', label: 'Resumir', starterName: 'Un resumen breve', starterAction: 'Resumir en tres líneas lo que acabo de estudiar.' },
      { id: 'comparar', label: 'Comparar', starterName: 'Una comparación', starterAction: 'Anotar una similitud y una diferencia entre dos ideas.' },
      { id: 'explicar', label: 'Explicar', starterName: 'Explicar con mis palabras', starterAction: 'Explicar una idea con mis propias palabras.' },
    ],
  },
  {
    id: 'practicar',
    label: 'Practicar',
    description: 'Probar una idea con acciones pequeñas y concretas.',
    approaches: [
      { id: 'imitar', label: 'Imitar', starterName: 'Seguir un ejemplo', starterAction: 'Resolver un ejemplo siguiendo un modelo.' },
      { id: 'completar', label: 'Completar', starterName: 'Completar un paso', starterAction: 'Completar un paso de un ejercicio sin mirar la solución.' },
      { id: 'corregir', label: 'Corregir', starterName: 'Aprender de un error', starterAction: 'Corregir un error y anotar qué lo causó.' },
    ],
  },
  {
    id: 'reflexionar',
    label: 'Reflexionar',
    description: 'Recordar lo aprendido y ajustar el siguiente paso.',
    approaches: [
      { id: 'recordar', label: 'Recordar', starterName: 'Traer una idea a la memoria', starterAction: 'Recordar una idea clave antes de revisar mis apuntes.' },
      { id: 'evaluar', label: 'Evaluar', starterName: 'Revisar lo que entendí', starterAction: 'Valorar qué parte del estudio entendí mejor.' },
      { id: 'ajustar', label: 'Ajustar', starterName: 'Elegir un ajuste pequeño', starterAction: 'Elegir un pequeño ajuste para la próxima sesión.' },
    ],
  },
];

const FREQUENCIES = new Set(['daily', 'weekly']);
const FAMILY_BY_ID = new Map(FAMILIES.map((family) => [family.id, family]));
export const MAX_PLANT_HISTORY = 100;
export const MAX_GARDEN_HISTORY = 500;
export const ESTABLISHED_GROWTH_POINTS = 21;
export const REPOT_READY_GROWTH_POINTS = 28;

function toIsoString(value, label = 'fecha') {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error(`La ${label} no es válida.`);
  return date.toISOString();
}

function requireText(value, label, maxLength) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`El campo ${label} es obligatorio.`);
  const result = value.trim();
  if (result.length > maxLength) throw new Error(`El campo ${label} supera ${maxLength} caracteres.`);
  return result;
}

function optionalText(value, label, maxLength) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error(`El campo ${label} debe ser texto.`);
  const result = value.trim();
  if (result.length > maxLength) throw new Error(`El campo ${label} supera ${maxLength} caracteres.`);
  return result;
}

function normalizeCue(cue) {
  if (cue === undefined || cue === null) return { moment: '', place: '' };
  if (typeof cue !== 'object' || Array.isArray(cue)) throw new Error('El contexto debe incluir momento y lugar.');
  return {
    moment: optionalText(cue.moment, 'momento', 100),
    place: optionalText(cue.place, 'lugar', 100),
  };
}

function assertValidHistory(history, label, maxLength) {
  if (!Array.isArray(history)) throw new Error(`El historial ${label} no es válido.`);
  if (history.length > maxLength) throw new Error(`El historial ${label} supera ${maxLength} eventos.`);
  for (const event of history) {
    if (!event || typeof event !== 'object' || Array.isArray(event)
      || typeof event.type !== 'string' || !event.type.trim()) {
      throw new Error(`Hay un evento no válido en el historial ${label}.`);
    }
    const hasDayKey = Object.hasOwn(event, 'dayKey');
    const hasTimestamp = Object.hasOwn(event, 'at');
    if (hasDayKey) parseDayKey(event.dayKey);
    if (hasTimestamp) toIsoString(event.at, `fecha del historial ${label}`);
    if (!hasDayKey && !hasTimestamp) throw new Error(`Un evento del historial ${label} no tiene fecha.`);
  }
}

function makeId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `plant-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getApproach(familyId, approachId) {
  const family = FAMILY_BY_ID.get(familyId);
  if (!family) throw new Error(`La familia ${String(familyId)} no existe.`);
  const approach = family.approaches.find(({ id }) => id === approachId);
  if (!approach) throw new Error(`El enfoque ${String(approachId)} no pertenece a ${family.label}.`);
  return { family, approach };
}

function eventAt(state, action) {
  return toIsoString(action.now ?? state.createdAt, 'fecha de acción');
}

function appendEvent(state, event) {
  return { ...state, history: [...state.history, event].slice(-MAX_GARDEN_HISTORY) };
}

function appendPlantHistory(plant, event) {
  return { ...plant, history: [...plant.history, event].slice(-MAX_PLANT_HISTORY) };
}

export function createInitialGarden({ now = new Date() } = {}) {
  const createdAt = toIsoString(now, 'fecha inicial');
  return {
    version: 1,
    onboardingComplete: false,
    plants: [],
    herbarium: [],
    history: [],
    preferences: { reducedMotion: false, showContext: true },
    clockMode: 'real',
    virtualDate: null,
    createdAt,
    lastProcessedDay: shiftDayKey(localDayKey(new Date(createdAt)), -1),
  };
}

export function createPlant({
  id = makeId(),
  familyId,
  approachId,
  name,
  action,
  frequency = 'daily',
  cue,
  now = new Date(),
} = {}) {
  const { family } = getApproach(familyId, approachId);
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error('El id de planta no es válido.');
  if (!FREQUENCIES.has(frequency)) throw new Error(`La frecuencia ${String(frequency)} no es válida.`);
  const createdAt = toIsoString(now, 'fecha de creación');
  return {
    id,
    familyId: family.id,
    approachId,
    name: requireText(name, 'nombre', 60),
    action: requireText(action, 'microacción', 240),
    frequency,
    cue: normalizeCue(cue),
    createdAt,
    status: 'active',
    health: 100,
    growthPoints: 0,
    level: 1,
    potStage: 1,
    consecutiveMisses: 0,
    lastCareDay: null,
    lastProcessedDay: shiftDayKey(localDayKey(new Date(createdAt)), -1),
    history: [],
  };
}

export function assertValidGarden(state) {
  if (!state || state.version !== 1) throw new Error('La versión del jardín no es compatible.');
  if (typeof state.onboardingComplete !== 'boolean') throw new Error('El estado de onboarding no es válido.');
  if (!Array.isArray(state.plants) || !Array.isArray(state.herbarium) || !Array.isArray(state.history)) {
    throw new Error('El estado del jardín no es válido.');
  }
  if (!state.preferences || typeof state.preferences !== 'object' || Array.isArray(state.preferences)) {
    throw new Error('Las preferencias del jardín no son válidas.');
  }
  if (!['real', 'demo'].includes(state.clockMode)) throw new Error('El modo del reloj no es válido.');
  if (state.clockMode === 'demo') parseDayKey(state.virtualDate);
  else if (state.virtualDate !== null) throw new Error('El reloj real no debe guardar una fecha virtual.');
  parseDayKey(state.lastProcessedDay);
  toIsoString(state.createdAt, 'fecha inicial');
  assertValidHistory(state.history, 'del jardín', MAX_GARDEN_HISTORY);

  const seenIds = new Set();
  for (const [plants, expectedStatus] of [[state.plants, 'active'], [state.herbarium, 'frozen']]) {
    for (const plant of plants) {
      if (!plant || typeof plant !== 'object' || Array.isArray(plant)) throw new Error('Hay una planta no válida.');
      getApproach(plant.familyId, plant.approachId);
      if (typeof plant.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(plant.id) || seenIds.has(plant.id)) {
        throw new Error('El id de planta falta, se repite o no es válido.');
      }
      seenIds.add(plant.id);
      requireText(plant.name, 'nombre', 60);
      requireText(plant.action, 'microacción', 240);
      if (!FREQUENCIES.has(plant.frequency)) throw new Error(`La frecuencia ${String(plant.frequency)} no es válida.`);
      normalizeCue(plant.cue);
      toIsoString(plant.createdAt, 'fecha de creación');
      if (plant.lastCareDay !== null) parseDayKey(plant.lastCareDay);
      if (!Number.isInteger(plant.health) || plant.health < 0 || plant.health > 100) {
        throw new Error('La salud debe estar entre 0 y 100.');
      }
      if (!Number.isFinite(plant.growthPoints) || plant.growthPoints < 0) {
        throw new Error('El crecimiento debe ser un número igual o mayor que 0.');
      }
      if (!Number.isInteger(plant.level) || plant.level < 1) throw new Error('El nivel de planta no es válido.');
      if (plant.potStage !== undefined && (!Number.isInteger(plant.potStage) || plant.potStage < 1 || plant.potStage > 2)) {
        throw new Error('El tamaño de macetero no es válido.');
      }
      if (!Number.isInteger(plant.consecutiveMisses) || plant.consecutiveMisses < 0) {
        throw new Error('El contador de omisiones no es válido.');
      }
      parseDayKey(plant.lastProcessedDay);
      if (plant.status !== expectedStatus) throw new Error(`El estado de la planta debe ser ${expectedStatus}.`);
      if (expectedStatus === 'frozen') toIsoString(plant.frozenAt, 'fecha de congelación');
      assertValidHistory(plant.history, `de ${plant.name}`, MAX_PLANT_HISTORY);
    }
  }
  return state;
}

function selectStarter(state, action) {
  if (state.onboardingComplete) return state;
  const { approach } = getApproach(action.familyId, action.approachId);
  const timestamp = eventAt(state, action);
  const plant = createPlant({
    familyId: action.familyId,
    approachId: action.approachId,
    name: action.name ?? approach.starterName,
    action: action.action ?? approach.starterAction,
    frequency: action.frequency ?? 'daily',
    cue: action.cue,
    now: timestamp,
  });
  const existingIndex = state.plants.findIndex(({ familyId }) => familyId === plant.familyId);
  if (existingIndex >= 0) {
    const existing = state.plants[existingIndex];
    if (existing.approachId === plant.approachId && existing.name === plant.name && existing.action === plant.action) return state;
  }
  const plants = [...state.plants];
  if (existingIndex >= 0) plants.splice(existingIndex, 1, plant);
  else plants.push(plant);
  const onboardingComplete = FAMILIES.every(({ id }) => plants.some((item) => item.familyId === id));
  const next = {
    ...state,
    plants,
    onboardingComplete,
    history: [...state.history, { type: 'starter-selected', plantId: plant.id, familyId: plant.familyId, at: timestamp }].slice(-MAX_GARDEN_HISTORY),
  };
  return next;
}

function addPlant(state, action) {
  const input = action.input ?? action;
  const timestamp = eventAt(state, action);
  const plant = createPlant({ ...input, now: input.now ?? timestamp });
  if (state.plants.some(({ id }) => id === plant.id) || state.herbarium.some(({ id }) => id === plant.id)) return state;
  return appendEvent({ ...state, plants: [...state.plants, plant] }, {
    type: 'plant-created', plantId: plant.id, familyId: plant.familyId, at: timestamp,
  });
}

function editPlant(state, action) {
  const index = state.plants.findIndex(({ id }) => id === action.plantId && id);
  if (index < 0) return state;
  const changes = action.changes ?? {};
  const current = state.plants[index];
  const nextPlant = { ...current };
  if (Object.hasOwn(changes, 'name')) nextPlant.name = requireText(changes.name, 'nombre', 60);
  if (Object.hasOwn(changes, 'action')) nextPlant.action = requireText(changes.action, 'microacción', 240);
  if (Object.hasOwn(changes, 'frequency')) {
    if (!FREQUENCIES.has(changes.frequency)) throw new Error(`La frecuencia ${String(changes.frequency)} no es válida.`);
    nextPlant.frequency = changes.frequency;
  }
  if (Object.hasOwn(changes, 'cue')) nextPlant.cue = normalizeCue(changes.cue);
  const timestamp = eventAt(state, action);
  nextPlant.updatedAt = timestamp;
  const plants = [...state.plants];
  plants[index] = nextPlant;
  return appendEvent({ ...state, plants }, { type: 'plant-edited', plantId: current.id, at: timestamp });
}

function repotPlant(state, action) {
  const plant = state.plants.find(({ id }) => id === action.plantId && id);
  if (!plant || (plant.potStage ?? 1) >= 2 || plant.growthPoints < REPOT_READY_GROWTH_POINTS) return state;
  const dayKey = action.dayKey ?? (state.clockMode === 'demo' ? state.virtualDate : localDayKey(new Date()));
  parseDayKey(dayKey);
  const readiness = plant.history.some((event) => event.type === 'plant-repot-ready')
    ? []
    : [{ type: 'plant-repot-ready', dayKey, growthPoints: REPOT_READY_GROWTH_POINTS }];
  const repotted = { type: 'plant-repotted', dayKey, growthPoints: plant.growthPoints, potStage: 2 };
  const updatedPlant = [...readiness, repotted].reduce(appendPlantHistory, { ...plant, potStage: 2 });
  const plants = state.plants.map((item) => item.id === plant.id ? updatedPlant : item);
  const history = [...state.history, ...[...readiness, repotted].map((event) => ({ ...event, plantId: plant.id }))]
    .slice(-MAX_GARDEN_HISTORY);
  return { ...state, plants, history };
}

function freezePlant(state, action) {
  const plant = state.plants.find(({ id }) => id === action.plantId);
  if (!plant) return state;
  const timestamp = eventAt(state, action);
  const frozenPlant = { ...plant, status: 'frozen', frozenAt: timestamp };
  return {
    ...state,
    plants: state.plants.filter(({ id }) => id !== plant.id),
    herbarium: [...state.herbarium, frozenPlant],
    history: [...state.history, { type: 'plant-frozen', plantId: plant.id, at: timestamp }].slice(-MAX_GARDEN_HISTORY),
  };
}

function deleteHerbariumPlant(state, action) {
  const plant = state.herbarium.find(({ id }) => id === action.plantId);
  if (!plant) return state;
  const timestamp = eventAt(state, action);
  return appendEvent({
    ...state,
    herbarium: state.herbarium.filter(({ id }) => id !== plant.id),
  }, { type: 'herbarium-entry-deleted', plantId: plant.id, at: timestamp });
}

function returnToToday(state, now) {
  const today = localDayKey(now);
  const previousDay = shiftDayKey(today, -1);
  return {
    ...state,
    clockMode: 'real',
    virtualDate: null,
    lastProcessedDay: previousDay,
    plants: state.plants.map((plant) => ({
      ...plant,
      lastCareDay: plant.lastCareDay && daysBetween(today, plant.lastCareDay) < 0 ? plant.lastCareDay : plant.lastCareDay === today ? today : null,
      lastProcessedDay: previousDay,
    })),
  };
}

export function reduceGarden(state, action) {
  assertValidGarden(state);
  if (!action || typeof action.type !== 'string') return state;
  switch (action.type) {
    case 'SELECT_STARTER_PLANT':
      return selectStarter(state, action);
    case 'ADD_PLANT':
      return addPlant(state, action);
    case 'EDIT_PLANT':
      return editPlant(state, action);
    case 'REPOT_PLANT':
      return repotPlant(state, action);
    case 'FREEZE_PLANT':
      return freezePlant(state, action);
    case 'DELETE_HERBARIUM_PLANT':
      return deleteHerbariumPlant(state, action);
    case 'REPLICATE_PLANT':
      return replicatePlant(state, action.plantId, action.now ?? new Date());
    case 'CARE_FOR_PLANT':
      return careForPlant(state, action.plantId, action.dayKey);
    case 'SIMULATE_HEALTHY_WEEK':
      return simulateHealthyWeek(state, action.now ?? new Date());
    case 'SIMULATE_RECOVERY':
      return simulateRecovery(state, action.now ?? new Date());
    case 'ADVANCE_DEMO': {
      const currentDay = state.clockMode === 'demo' ? state.virtualDate : localDayKey(action.now ?? new Date());
      const days = action.days === 7 ? 7 : 1;
      return rollGardenTo(state, shiftDayKey(currentDay, days));
    }
    case 'RETURN_TO_TODAY':
      return returnToToday(state, action.now ?? new Date());
    case 'IMPORT_GARDEN':
      assertValidGarden(action.garden);
      return action.garden;
    case 'NEW_GARDEN':
      return createInitialGarden({ now: eventAt(state, action) });
    default:
      return state;
  }
}

function isDue(plant, dayKey) {
  if (plant.frequency === 'daily') return true;
  const anchorDay = plant.lastCareDay ?? localDayKey(plant.createdAt);
  const elapsed = daysBetween(anchorDay, dayKey);
  return elapsed > 0 && elapsed % 7 === 0;
}

function recordMiss(plant, dayKey, penalize = true) {
  if (!isDue(plant, dayKey)) return plant;
  const consecutiveMisses = plant.consecutiveMisses + 1;
  const health = penalize && consecutiveMisses % 2 === 0 ? Math.max(0, plant.health - 10) : plant.health;
  return appendPlantHistory({ ...plant, health, consecutiveMisses }, {
    type: 'miss', dayKey, health,
  });
}

function processCompletedDays(state, targetDayKey) {
  parseDayKey(targetDayKey);
  let history = state.history;
  const plants = state.plants.map((initialPlant) => {
    const dayCount = daysBetween(initialPlant.lastProcessedDay, targetDayKey);
    if (dayCount <= 1) return initialPlant;
    let plant = initialPlant;
    for (let offset = 1; offset < dayCount; offset += 1) {
      const dayKey = shiftDayKey(initialPlant.lastProcessedDay, offset);
      const nextPlant = recordMiss(plant, dayKey, state.preferences.pausePolicy !== 'keep-progress');
      if (nextPlant !== plant) {
        history = [...history, { type: 'plant-missed', plantId: plant.id, dayKey, health: nextPlant.health }];
        plant = nextPlant;
      }
    }
    return { ...plant, lastProcessedDay: shiftDayKey(targetDayKey, -1) };
  });
  const processedThrough = shiftDayKey(targetDayKey, -1);
  const globalLastProcessed = daysBetween(state.lastProcessedDay, processedThrough) > 0
    ? processedThrough
    : state.lastProcessedDay;
  return {
    ...state,
    plants,
    history: history.slice(-MAX_GARDEN_HISTORY),
    lastProcessedDay: globalLastProcessed,
  };
}

export function careForPlant(state, plantId, dayKey) {
  assertValidGarden(state);
  parseDayKey(dayKey);
  const originalPlant = state.plants.find(({ id, status }) => id === plantId && status === 'active');
  if (!originalPlant || originalPlant.lastCareDay === dayKey) return state;
  if (daysBetween(originalPlant.lastProcessedDay, dayKey) < 0) return state;
  if (originalPlant.history.some((event) => event.type === 'miss' && event.dayKey === dayKey)) return state;
  if (daysBetween(localDayKey(originalPlant.createdAt), dayKey) < 0) return state;
  if (originalPlant.frequency === 'weekly' && originalPlant.lastCareDay
    && daysBetween(originalPlant.lastCareDay, dayKey) < 7) return state;

  const rolled = processCompletedDays(state, dayKey);
  const plant = rolled.plants.find(({ id }) => id === plantId);
  if (!plant) return rolled;
  const health = Math.min(100, plant.health + 5);
  const growthPoints = plant.growthPoints + 1;
  const established = plant.growthPoints < ESTABLISHED_GROWTH_POINTS && growthPoints >= ESTABLISHED_GROWTH_POINTS
    ? { type: 'plant-evolved', dayKey, growthPoints: ESTABLISHED_GROWTH_POINTS, milestone: 'established' }
    : null;
  const repotReady = plant.growthPoints < REPOT_READY_GROWTH_POINTS && growthPoints >= REPOT_READY_GROWTH_POINTS
    ? { type: 'plant-repot-ready', dayKey, growthPoints: REPOT_READY_GROWTH_POINTS }
    : null;
  const caredPlant = appendPlantHistory({
    ...plant,
    health,
    growthPoints,
    level: Math.max(plant.level, Math.floor(growthPoints / 7) + 1),
    consecutiveMisses: 0,
    lastCareDay: dayKey,
    lastProcessedDay: dayKey,
  }, { type: 'care', dayKey, health, growthPoints });
  const milestones = [established, repotReady].filter(Boolean);
  const updatedPlant = milestones.reduce(appendPlantHistory, caredPlant);
  const gardenHistory = [
    ...rolled.history,
    { type: 'plant-cared', plantId, dayKey, health, growthPoints },
    ...milestones.map((event) => ({ ...event, plantId })),
  ].slice(-MAX_GARDEN_HISTORY);
  return {
    ...rolled,
    plants: rolled.plants.map((item) => item.id === plantId ? updatedPlant : item),
    history: gardenHistory,
    lastProcessedDay: daysBetween(rolled.lastProcessedDay, dayKey) > 0 ? dayKey : rolled.lastProcessedDay,
    ...(rolled.clockMode === 'demo' ? { virtualDate: dayKey } : {}),
  };
}

export function rollGardenTo(state, targetDayKey) {
  assertValidGarden(state);
  parseDayKey(targetDayKey);
  const currentDay = state.clockMode === 'demo'
    ? state.virtualDate
    : shiftDayKey(state.lastProcessedDay, 1);
  if (daysBetween(currentDay, targetDayKey) < 0) return state;
  const rolled = processCompletedDays(state, targetDayKey);
  if (rolled.clockMode === 'demo' && rolled.virtualDate === targetDayKey) return rolled;
  return { ...rolled, clockMode: 'demo', virtualDate: targetDayKey };
}

export function simulateHealthyWeek(state, now = new Date()) {
  assertValidGarden(state);
  const startDay = state.clockMode === 'demo' ? state.virtualDate : localDayKey(now);
  let simulated = state;
  const plantIds = state.plants.map(({ id }) => id);
  for (let offset = 0; offset < 7; offset += 1) {
    const dayKey = shiftDayKey(startDay, offset);
    for (const plantId of plantIds) simulated = careForPlant(simulated, plantId, dayKey);
  }
  return rollGardenTo(simulated, shiftDayKey(startDay, 7));
}

export function simulateRecovery(state, now = new Date()) {
  assertValidGarden(state);
  const startDay = state.clockMode === 'demo' ? state.virtualDate : localDayKey(now);
  const recoveryDay = shiftDayKey(startDay, 3);
  let simulated = rollGardenTo(state, recoveryDay);
  const plantIds = simulated.plants.map(({ id }) => id);
  for (const plantId of plantIds) simulated = careForPlant(simulated, plantId, recoveryDay);
  return simulated;
}

export function getActivePlants(state) {
  return state.plants.filter(({ status }) => status === 'active');
}

export function getHerbarium(state) {
  return state.herbarium;
}

export function replicatePlant(state, plantId, now = new Date()) {
  assertValidGarden(state);
  const source = state.herbarium.find(({ id }) => id === plantId);
  if (!source) return state;
  const timestamp = toIsoString(now, 'fecha de réplica');
  let replica = createPlant({
    familyId: source.familyId,
    approachId: source.approachId,
    name: source.name,
    action: source.action,
    frequency: source.frequency,
    cue: source.cue,
    now: timestamp,
  });
  while (state.plants.some(({ id }) => id === replica.id) || state.herbarium.some(({ id }) => id === replica.id)) {
    replica = createPlant({
      familyId: source.familyId,
      approachId: source.approachId,
      name: source.name,
      action: source.action,
      frequency: source.frequency,
      cue: source.cue,
      now: timestamp,
    });
  }
  replica = {
    ...replica,
    health: source.health,
    growthPoints: Math.floor(source.growthPoints * 0.8),
    level: source.level,
    potStage: source.potStage ?? 1,
  };
  return appendEvent({ ...state, plants: [...state.plants, replica] }, {
    type: 'plant-replicated', sourcePlantId: source.id, plantId: replica.id, at: timestamp,
  });
}

export function canUnlockNursery(state) {
  assertValidGarden(state);
  const knownPlants = [...state.plants, ...state.herbarium];
  if (knownPlants.length === 0) return false;
  const careEvents = state.history.filter((event) => event.type === 'plant-cared' && event.dayKey);
  const possibleEnds = [...new Set(careEvents.map(({ dayKey }) => dayKey))];
  for (const endDay of possibleEnds) {
    const startDay = shiftDayKey(endDay, -6);
    // New plants added after a proven week must not relock the nursery.
    const plantsAtStart = knownPlants.filter((plant) => daysBetween(localDayKey(plant.createdAt), startDay) >= 0);
    if (plantsAtStart.length === 0) continue;
    let fullWeek = true;
    for (let offset = 0; offset < 7; offset += 1) {
      const dayKey = shiftDayKey(startDay, offset);
      const caredIds = new Set(careEvents.filter((event) => event.dayKey === dayKey).map(({ plantId }) => plantId));
      if (plantsAtStart.some(({ id }) => !caredIds.has(id))) {
        fullWeek = false;
        break;
      }
    }
    if (fullWeek) return true;
  }
  return false;
}
