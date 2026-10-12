import { assertValidGarden, getActivePlants, MAX_GARDEN_HISTORY, MAX_PLANT_HISTORY } from './state.js';
import { localDayKey, parseDayKey } from './time.js';

export const STORAGE_KEY = 'kaizen-garden-v2';
export const EXPORT_FORMAT = 'kaizen-garden-export';
export const EXPORT_VERSION = 1;

function assertStorage(storage, method) {
  if (!storage || typeof storage[method] !== 'function') {
    throw new Error(`El almacenamiento local no admite ${method}.`);
  }
}

function parseTimestamp(value, label) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error(`La ${label} no es válida.`);
  return date.toISOString();
}

function retainRecentHistory(garden) {
  if (!garden || typeof garden !== 'object' || Array.isArray(garden)) return garden;
  const boundHistory = (history, limit) => Array.isArray(history) && history.length > limit
    ? history.slice(-limit)
    : history;
  const boundPlants = (plants) => {
    if (!Array.isArray(plants)) return plants;
    const hasOversizedHistory = plants.some((plant) => plant && typeof plant === 'object'
      && !Array.isArray(plant) && Array.isArray(plant.history) && plant.history.length > MAX_PLANT_HISTORY);
    return hasOversizedHistory ? plants.map((plant) => {
      if (!plant || typeof plant !== 'object' || Array.isArray(plant)) return plant;
      const history = boundHistory(plant.history, MAX_PLANT_HISTORY);
      return history === plant.history ? plant : { ...plant, history };
    }) : plants;
  };
  const history = boundHistory(garden.history, MAX_GARDEN_HISTORY);
  const plants = boundPlants(garden.plants);
  const herbarium = boundPlants(garden.herbarium);
  if (history === garden.history && plants === garden.plants && herbarium === garden.herbarium) return garden;
  return { ...garden, history, plants, herbarium };
}

function lastActivityOf(garden) {
  const days = [];
  for (const event of garden.history) {
    if (typeof event.dayKey === 'string') {
      parseDayKey(event.dayKey);
      days.push(event.dayKey);
    } else if (event.at) {
      try { days.push(localDayKey(event.at)); } catch { /* Ignore non-date metadata. */ }
    }
  }
  for (const plant of [...garden.plants, ...garden.herbarium]) {
    days.push(localDayKey(plant.createdAt));
    if (plant.lastCareDay) days.push(plant.lastCareDay);
    if (plant.frozenAt) days.push(localDayKey(plant.frozenAt));
    if (plant.updatedAt) days.push(localDayKey(plant.updatedAt));
  }
  return days.sort().at(-1) ?? null;
}

export function summarizeImport(garden) {
  assertValidGarden(garden);
  return {
    plantCount: getActivePlants(garden).length,
    herbariumCount: garden.herbarium.length,
    lastActivity: lastActivityOf(garden),
  };
}

export function loadGarden(storage) {
  assertStorage(storage, 'getItem');
  try {
    const saved = storage.getItem(STORAGE_KEY) ?? storage.getItem('kaizen-garden-v1');
    if (saved === null) return null;
    const garden = retainRecentHistory(JSON.parse(saved));
    assertValidGarden(garden);
    return garden;
  } catch {
    return null;
  }
}

export function saveGarden(state, storage) {
  assertStorage(storage, 'setItem');
  const garden = retainRecentHistory(state);
  assertValidGarden(garden);
  storage.setItem(STORAGE_KEY, JSON.stringify(garden));
}

export function serializeGarden(state, exportedAt = new Date()) {
  const garden = retainRecentHistory(state);
  assertValidGarden(garden);
  const payload = {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: parseTimestamp(exportedAt, 'fecha de exportación'),
    garden,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseGardenJson(text) {
  try {
    if (typeof text !== 'string' || !text.trim()) throw new Error('El archivo está vacío.');
    const payload = JSON.parse(text);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('El archivo no contiene un jardín válido.');
    }
    if (payload.format !== EXPORT_FORMAT) throw new Error('El archivo no es una exportación de Jardín Kaizen.');
    if (payload.version !== EXPORT_VERSION) throw new Error(`La versión ${String(payload.version)} no es compatible.`);
    if (typeof payload.exportedAt !== 'string') throw new Error('Falta la fecha de exportación.');
    parseTimestamp(payload.exportedAt, 'fecha de exportación');
    const garden = retainRecentHistory(payload.garden);
    assertValidGarden(garden);
    return { ok: true, garden, summary: summarizeImport(garden) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'No se pudo leer el archivo.' };
  }
}
