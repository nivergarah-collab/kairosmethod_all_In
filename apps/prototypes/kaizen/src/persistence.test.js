import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialGarden, reduceGarden } from './state.js';
import {
  STORAGE_KEY,
  loadGarden,
  parseGardenJson,
  saveGarden,
  serializeGarden,
  summarizeImport,
} from './persistence.js';

const now = new Date('2026-10-08T12:00:00.000Z');

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

function sampleGarden() {
  let garden = createInitialGarden({ now });
  garden = reduceGarden(garden, { type: 'SELECT_STARTER_PLANT', familyId: 'comprender', approachId: 'resumir', now });
  garden = reduceGarden(garden, { type: 'SELECT_STARTER_PLANT', familyId: 'practicar', approachId: 'imitar', now });
  garden = reduceGarden(garden, { type: 'SELECT_STARTER_PLANT', familyId: 'reflexionar', approachId: 'recordar', now });
  garden = reduceGarden(garden, { type: 'FREEZE_PLANT', plantId: garden.plants[0].id, now });
  return garden;
}

test('la clave local y el jardín vacío no necesitan backend', () => {
  assert.equal(STORAGE_KEY, 'kaizen-garden-v2');
  assert.equal(loadGarden(new MemoryStorage()), null);
});

test('guardar y cargar recupera el estado completo desde JSON local', () => {
  const storage = new MemoryStorage();
  const garden = sampleGarden();

  saveGarden(garden, storage);
  const loaded = loadGarden(storage);

  assert.deepEqual(loaded, garden);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).version, 1);
});

test('migrar a v2 lee el jardín v1 y conserva intacto su almacenamiento', () => {
  const storage = new MemoryStorage();
  const original = JSON.stringify(sampleGarden());
  storage.setItem('kaizen-garden-v1', original);
  const garden = loadGarden(storage);
  saveGarden(garden, storage);
  assert.equal(storage.getItem('kaizen-garden-v1'), original);
  assert.deepEqual(loadGarden(storage), garden);
});

test('un valor corrupto no rompe el arranque ni se interpreta como contenido ejecutable', () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, '{esto no es json');
  assert.equal(loadGarden(storage), null);

  const hostile = '{"version":1,"garden":{"__proto__":{"polluted":true}}}';
  const result = parseGardenJson(hostile);
  assert.equal(result.ok, false);
  assert.equal({}.polluted, undefined);
});

test('exportar con la misma fecha produce JSON estable y resume activos y herbario', () => {
  const garden = sampleGarden();
  const exportedAt = new Date('2026-10-09T12:00:00.000Z');
  const json = serializeGarden(garden, exportedAt);
  const repeated = serializeGarden(garden, exportedAt);
  const parsed = parseGardenJson(json);

  assert.equal(json, repeated);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.garden, garden);
  assert.deepEqual(parsed.summary, { plantCount: 2, herbariumCount: 1, lastActivity: '2026-10-08' });
  assert.deepEqual(summarizeImport(garden), parsed.summary);
});

test('JSON inválido, versión desconocida y estado incompleto se rechazan sin reemplazo', () => {
  const before = sampleGarden();
  const cases = [
    '{',
    JSON.stringify({ format: 'kaizen-garden-export', version: 9, garden: before }),
    JSON.stringify({ format: 'kaizen-garden-export', version: 1, garden: before }),
    JSON.stringify({ format: 'kaizen-garden-export', version: 1, garden: { version: 1, plants: [] } }),
  ];

  for (const text of cases) assert.equal(parseGardenJson(text).ok, false);
  assert.equal(before.plants.length, 2);
  assert.equal(before.herbarium.length, 1);
});

test('la importación rechaza eventos de historial con tipo o fecha inválidos', () => {
  const garden = sampleGarden();
  const plantId = garden.plants[0].id;
  const invalidHistories = [
    [{ type: 'care' }],
    [{ type: 'care', dayKey: '2026-02-31' }],
    [{ type: 'care', at: 'no-es-una-fecha' }],
    [{ dayKey: '2026-10-08' }],
  ];

  for (const history of invalidHistories) {
    const candidate = {
      ...garden,
      plants: garden.plants.map((plant) => plant.id === plantId ? { ...plant, history } : plant),
    };
    const result = parseGardenJson(JSON.stringify({
      format: 'kaizen-garden-export', version: 1, exportedAt: now.toISOString(), garden: candidate,
    }));
    assert.equal(result.ok, false);
  }
});

test('la importación conserva los límites de historial ya aplicados por el jardín', () => {
  const garden = sampleGarden();
  const plantId = garden.plants[0].id;
  const plantEvent = { type: 'care', dayKey: '2026-10-08', health: 100, growthPoints: 1 };
  const gardenEvent = { type: 'plant-cared', dayKey: '2026-10-08', plantId };
  const payload = (candidate) => JSON.stringify({
    format: 'kaizen-garden-export', version: 1, exportedAt: now.toISOString(), garden: candidate,
  });
  const maxPlantHistory = {
    ...garden,
    plants: garden.plants.map((plant) => plant.id === plantId
      ? { ...plant, history: Array.from({ length: 100 }, () => plantEvent) }
      : plant),
  };
  const maxGardenHistory = { ...garden, history: Array.from({ length: 500 }, () => gardenEvent) };
  const oversizedPlantHistory = {
    ...maxPlantHistory,
    plants: maxPlantHistory.plants.map((plant) => plant.id === plantId
      ? { ...plant, history: Array.from({ length: 101 }, (_, sequence) => ({ ...plantEvent, sequence })) }
      : plant),
  };
  const oversizedGardenHistory = {
    ...maxGardenHistory,
    history: Array.from({ length: 501 }, (_, sequence) => ({ ...gardenEvent, sequence })),
  };

  assert.equal(parseGardenJson(payload(maxPlantHistory)).ok, true);
  assert.equal(parseGardenJson(payload(maxGardenHistory)).ok, true);
  const parsedPlant = parseGardenJson(payload(oversizedPlantHistory));
  const parsedGarden = parseGardenJson(payload(oversizedGardenHistory));
  assert.equal(parsedPlant.ok, true);
  assert.equal(parsedPlant.garden.plants.find(({ id }) => id === plantId).history.length, 100);
  assert.equal(parsedPlant.garden.plants.find(({ id }) => id === plantId).history[0].sequence, 1);
  assert.equal(parsedGarden.ok, true);
  assert.equal(parsedGarden.garden.history.length, 500);
  assert.equal(parsedGarden.garden.history[0].sequence, 1);
});

test('cargar una exportación v1 extensa conserva los eventos recientes sin editar su origen', () => {
  const storage = new MemoryStorage();
  const garden = {
    ...sampleGarden(),
    history: Array.from({ length: 501 }, (_, sequence) => ({
      type: 'plant-cared', dayKey: '2026-10-08', plantId: 'old-plant', sequence,
    })),
  };
  const original = JSON.stringify(garden);
  storage.setItem('kaizen-garden-v1', original);

  const loaded = loadGarden(storage);

  assert.equal(loaded.history.length, 500);
  assert.equal(loaded.history[0].sequence, 1);
  assert.equal(storage.getItem('kaizen-garden-v1'), original);
});
