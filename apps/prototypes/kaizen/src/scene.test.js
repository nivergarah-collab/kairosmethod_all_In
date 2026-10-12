import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createInitialGarden } from './state.js';
import { prepareGarden, reduceSpatialGarden, getPlantPosition, ZONES } from './scene.js';
import * as scene from './scene.js';
import { parseGardenJson, serializeGarden } from './persistence.js';

const now = new Date('2026-10-08T15:00:00Z');
function gardenWithFirstSeed() {
  const garden = prepareGarden(createInitialGarden({ now }));
  return reduceSpatialGarden(garden, { type: 'ADD_PLANT', input: scene.getSeedOptions()[0], now });
}

test('primera visita entra al jardín vacío y no planta hábitos automáticamente', () => {
  const garden = prepareGarden(createInitialGarden({ now }));
  assert.equal(garden.onboardingComplete, true);
  assert.equal(garden.plants.length, 0);
  assert.equal(ZONES.length, 4);
  assert.deepEqual(prepareGarden(garden), garden);
});
test('una semilla explícita crea una planta en incubación', () => {
  const garden = prepareGarden(createInitialGarden({ now }));
  assert.equal(garden.plants.length, 0);
  const planted = reduceSpatialGarden(garden, { type: 'ADD_PLANT', input: scene.getSeedOptions()[0], now });
  assert.equal(planted.plants.length, 1);
  assert.equal(scene.getPlantGrowthStage(planted.plants[0].growthPoints).id, 'incubating');
});
test('las imágenes de etapa avanzan en los hitos existentes de crecimiento', () => {
  assert.equal(scene.getPlantGrowthStage(0).id, 'incubating');
  assert.equal(scene.getPlantGrowthStage(1).id, 'germinating');
  assert.equal(scene.getPlantGrowthStage(6).id, 'germinating');
  assert.equal(scene.getPlantGrowthStage(7).id, 'seedling');
  assert.equal(scene.getPlantGrowthStage(20).id, 'seedling');
  assert.equal(scene.getPlantGrowthStage(21).id, 'established');
});
test('el brote empieza visible y crece sin saltos dentro de cada etapa', () => {
  const scaleAt = (growth) => scene.getPlantStageScale(growth);
  const germinationScales = Array.from({ length: 6 }, (_, index) => scaleAt(index + 1));
  const seedlingScales = Array.from({ length: 14 }, (_, index) => scaleAt(index + 7));

  assert.ok(Math.abs(scaleAt(1) - 0.62) < 1e-9, 'el primer brote debe distinguirse en móvil');
  assert.ok(Math.abs(scaleAt(6) - 0.78) < 1e-9);
  assert.ok(Math.abs(scaleAt(7) - 0.78) < 1e-9, 'el cambio de etapa no debe reducir el brote');
  assert.ok(Math.abs(scaleAt(20) - 0.96) < 1e-9);
  assert.equal(scaleAt(21), 1);
  assert.ok(germinationScales.every((scale, index) => index === 0 || scale >= germinationScales[index - 1]));
  assert.ok(seedlingScales.every((scale, index) => index === 0 || scale >= seedlingScales[index - 1]));
});
test('el brote de cotiledones ocupa un tamaño reconocible en móvil desde el primer cuidado', async () => {
  const css = await readFile(new URL('./scene.css', import.meta.url), 'utf8');
  const rule = css.match(/\.plant-cotyledon-sprout\s*\{([^}]+)\}/)?.[1] ?? '';
  const widthScale = Number(rule.match(/width:\s*([\d.]+)%/i)?.[1] ?? 0) / 100;
  const heightScale = Number(rule.match(/height:\s*([\d.]+)%/i)?.[1] ?? 0) / 100;
  const mobilePlantWidth = 130;
  const mobilePlantHeight = 210;
  const imageAspect = 1024 / 1536;
  const fittedImageWidth = Math.min(mobilePlantWidth * widthScale, mobilePlantHeight * heightScale * imageAspect);
  const visibleCotyledonWidth = fittedImageWidth * 0.58 * scene.getPlantStageScale(1);

  assert.ok(visibleCotyledonWidth >= 34, `las hojas iniciales ocuparían solo ${visibleCotyledonWidth.toFixed(1)} px`);
});
test('la semilla de incubación se distingue incluso en un viewport móvil', async () => {
  const css = await readFile(new URL('./scene.css', import.meta.url), 'utf8');
  const rule = css.match(/\.plant-seed-under-soil\s*\{([^}]+)\}/)?.[1] ?? '';
  const backgroundScale = Number(rule.match(/background-size:\s*([\d.]+)%/i)?.[1] ?? 0) / 100;
  const backgroundY = Number(rule.match(/background-position:\s*center\s+([\d.]+)%/i)?.[1] ?? 50) / 100;
  const artWidthScale = Number(rule.match(/width:\s*([\d.]+)%/i)?.[1] ?? 0) / 100;
  const artHeightScale = Number(rule.match(/height:\s*([\d.]+)%/i)?.[1] ?? 0) / 100;
  const mobileArtWidth = 130 * artWidthScale;
  const mobileArtHeight = 210 * artHeightScale;
  const backgroundImageAspect = 2048 / 768;
  const backgroundHeight = mobileArtWidth * backgroundScale / backgroundImageAspect;
  const seedCenterY = backgroundHeight * 0.5 + (mobileArtHeight - backgroundHeight) * backgroundY;
  const seedShareOfImageWidth = 0.06;
  const renderedSeedWidth = mobileArtWidth * backgroundScale * seedShareOfImageWidth;

  assert.ok(renderedSeedWidth >= 10, `la semilla ocuparía solo ${renderedSeedWidth.toFixed(1)} px`);
  assert.ok(seedCenterY > mobileArtHeight * 0.25 && seedCenterY < mobileArtHeight * 0.65, 'el encuadre debe centrar la semilla bajo el sustrato y dentro del borde ovalado');
  assert.match(rule, /clip-path:\s*ellipse\(/i, 'el sustrato debe integrarse con el macetero, no quedar como una franja rectangular');
});
test('mover y cambiar de zona persiste en JSON sin perder crecimiento', () => {
  let garden = gardenWithFirstSeed();
  const plant = garden.plants[0];
  garden = reduceSpatialGarden(garden, { type: 'MOVE_PLANT', plantId: plant.id, zoneId: 'balcony', x: 77, y: 82 });
  garden = reduceSpatialGarden(garden, { type: 'SET_ZONE', zoneId: 'balcony' });
  const restored = parseGardenJson(serializeGarden(garden, now)).garden;
  assert.deepEqual(getPlantPosition(restored, restored.plants[0]), { zoneId: 'balcony', x: 77, y: 82 });
  assert.equal(restored.preferences.scene.activeZone, 'balcony');
  assert.equal(restored.plants[0].growthPoints, plant.growthPoints);
});

test('importar posiciones malformadas las limita, recoloca y descarta ids huérfanos', () => {
  let garden = gardenWithFirstSeed();
  garden = reduceSpatialGarden(garden, { type: 'ADD_PLANT', input: scene.getSeedOptions()[1], now });
  const [first, second] = garden.plants;
  const imported = {
    ...garden,
    preferences: {
      ...garden.preferences,
      scene: {
        activeZone: 'reading',
        positions: {
          [first.id]: { zoneId: 'reading', x: 999, y: -12 },
          [second.id]: { zoneId: 'unknown-room', x: 50, y: 70 },
          orphaned: { zoneId: 'balcony', x: 50, y: 70 },
        },
      },
    },
  };
  const parsed = parseGardenJson(JSON.stringify({
    format: 'kaizen-garden-export', version: 1, exportedAt: now.toISOString(), garden: imported,
  }));
  assert.equal(parsed.ok, true);

  const restored = reduceSpatialGarden(garden, { type: 'IMPORT_GARDEN', garden: parsed.garden });

  assert.equal(restored.preferences.scene.activeZone, 'reading');
  assert.deepEqual(getPlantPosition(restored, first), { zoneId: 'reading', x: 88, y: 48 });
  assert.deepEqual(getPlantPosition(restored, second), { zoneId: 'reading', x: 50, y: 88 });
  assert.deepEqual(Object.keys(restored.preferences.scene.positions).sort(), [first.id, second.id].sort());
});

test('las posiciones por defecto mantienen separadas hasta treinta plantas', () => {
  let garden = prepareGarden(createInitialGarden({ now }));
  for (let index = 0; index < 30; index += 1) {
    garden = reduceSpatialGarden(garden, {
      type: 'ADD_PLANT',
      input: { ...scene.getSeedOptions()[0], id: `many-${index}`, name: `Planta ${index}` },
      now,
    });
  }
  const positions = garden.plants.map((plant) => getPlantPosition(garden, plant));
  const uniquePositions = new Set(positions.map(({ x, y }) => `${x}:${y}`));

  assert.equal(positions.length, 30);
  assert.equal(uniquePositions.size, 30);
  assert.deepEqual(positions.slice(0, 3), [
    { zoneId: 'greenhouse', x: 26, y: 88 },
    { zoneId: 'greenhouse', x: 50, y: 88 },
    { zoneId: 'greenhouse', x: 74, y: 88 },
  ]);
  assert.ok(positions.every(({ x, y }) => x >= 12 && x <= 88 && y >= 48 && y <= 88));
  assert.ok(positions.slice(3).some(({ y }) => y < 76), 'las posiciones nuevas deben usar más profundidad del piso');
  assert.ok(positions.slice(3).every(({ y }) => y >= 72), 'las plantas deben permanecer en el piso visible');
});
test('posiciones corruptas e ids ajenos se rechazan o normalizan', () => {
  const garden = gardenWithFirstSeed();
  assert.equal(reduceSpatialGarden(garden, { type: 'MOVE_PLANT', plantId: 'missing', zoneId: 'balcony', x: 50, y: 80 }), garden);
  assert.throws(() => reduceSpatialGarden(garden, { type: 'MOVE_PLANT', plantId: garden.plants[0].id, zoneId: 'balcony', x: NaN, y: 80 }));
  const moved = reduceSpatialGarden(garden, { type: 'MOVE_PLANT', plantId: garden.plants[0].id, zoneId: 'balcony', x: 900, y: -200 });
  assert.deepEqual(getPlantPosition(moved, moved.plants[0]), { zoneId: 'balcony', x: 88, y: 48 });
});
test('v2 permite pausas sin reducir salud ni crecimiento', () => {
  const garden = gardenWithFirstSeed();
  const advanced = reduceSpatialGarden(garden, { type: 'ADVANCE_DEMO', days: 7, now });
  for (const plant of advanced.plants) {
    assert.equal(plant.health, 100);
    assert.equal(plant.growthPoints, 0);
    assert.ok(plant.history.every((event) => event.health === undefined || event.health === 100));
  }
});

test('crear y replicar plantas las coloca en la zona que estoy mirando', () => {
  let garden = prepareGarden(createInitialGarden({ now }));
  garden = reduceSpatialGarden(garden, { type: 'SET_ZONE', zoneId: 'reading' });
  garden = reduceSpatialGarden(garden, { type: 'ADD_PLANT', input: scene.getSeedOptions()[0], now });
  assert.equal(getPlantPosition(garden, garden.plants.at(-1)).zoneId, 'reading');
  const frozenId = garden.plants[0].id;
  garden = reduceSpatialGarden(garden, { type: 'FREEZE_PLANT', plantId: frozenId, now });
  garden = reduceSpatialGarden(garden, { type: 'REPLICATE_PLANT', plantId: frozenId, now });
  assert.equal(getPlantPosition(garden, garden.plants.at(-1)).zoneId, 'reading');
});

test('un swipe puede comenzar sobre la planta, pero no sobre controles', () => {
  assert.equal(typeof scene.beginZoneSwipe, 'function');
  const background = { closest: () => null };
  const plantElement = { dataset: { plantId: 'plant-1' } };
  const plantButton = { closest: (selector) => selector === '.spatial-plant' || selector.startsWith('button,') ? plantElement : null };
  const controlButton = { closest: (selector) => selector.startsWith('button,') ? {} : null };
  assert.equal(scene.beginZoneSwipe(controlButton, 7, 180, 260), null);

  const gesture = scene.beginZoneSwipe(background, 7, 180, 260);
  assert.equal(scene.getZoneSwipeDirection(gesture, { pointerId: 8, clientX: 80, clientY: 260 }), 0);
  assert.equal(scene.getZoneSwipeDirection(gesture, { pointerId: 7, clientX: 160, clientY: 360 }), 0);
  assert.equal(scene.getZoneSwipeDirection(gesture, { pointerId: 7, clientX: 80, clientY: 260 }), 1);
  const plantGesture = scene.beginZoneSwipe(plantButton, 7, 180, 260);
  assert.equal(plantGesture.plantId, 'plant-1');
  assert.equal(scene.getZoneSwipeDirection(plantGesture, { pointerId: 7, clientX: 80, clientY: 260 }), 1);
  assert.equal(scene.hasZoneSwipeMoved(plantGesture, { pointerId: 7, clientX: 167, clientY: 260 }), true);
  assert.equal(scene.hasZoneSwipeMoved(plantGesture, { pointerId: 7, clientX: 185, clientY: 260 }), false);
  assert.equal(scene.hasZoneSwipeMoved(plantGesture, { pointerId: 8, clientX: 80, clientY: 260 }), false);
});
test('un swipe libera el puntero si termina fuera de la escena', () => {
  const gesture = scene.beginZoneSwipe({ closest: () => null }, 7, 180, 260);
  const pointerUpOutside = { pointerId: 7, type: 'pointerup', clientX: 80, clientY: 260 };

  assert.deepEqual(scene.getZoneSwipeOutsideEnd(gesture, pointerUpOutside, false), { offset: 1, plantId: null });
  assert.equal(scene.getZoneSwipeOutsideEnd(gesture, pointerUpOutside, true), null);
  assert.deepEqual(scene.getZoneSwipeOutsideEnd(gesture, { ...pointerUpOutside, type: 'pointercancel' }, false), { offset: 0, plantId: null });
  assert.equal(scene.getZoneSwipeOutsideEnd(gesture, { ...pointerUpOutside, pointerId: 8 }, false), null);
});
test('la deriva vertical sobre una planta no silencia un toque', () => {
  const plant = { dataset: { plantId: 'plant-1' } };
  const target = { closest: () => plant };
  const gesture = scene.beginZoneSwipe(target, 12, 180, 260);

  assert.equal(scene.hasZoneSwipeMoved(gesture, { pointerId: 12, clientX: 181, clientY: 280 }), false);
  assert.equal(scene.hasZoneSwipeMoved(gesture, { pointerId: 12, clientX: 194, clientY: 264 }), true);
});

test('un arrastre de planta no se interpreta como cambio de zona', () => {
  const background = { closest: () => null };
  const plantElement = { dataset: { plantId: 'plant-1' } };
  const plantButton = { closest: (selector) => selector === '.spatial-plant' || selector.startsWith('button,') ? plantElement : null };
  const swipe = scene.beginZoneSwipe(background, 9, 320, 240);
  const drag = scene.createPlantDrag('plant-1', 10, { zoneId: 'greenhouse', x: 40, y: 78 }, 320, 240);

  assert.equal(scene.getZoneSwipeDirection(swipe, { pointerId: 9, clientX: 220, clientY: 245 }), 1);
  assert.equal(scene.beginZoneSwipe(plantButton, 10, 320, 240).plantId, 'plant-1');
  assert.equal(scene.getZoneSwipeDirection(drag, { pointerId: 10, clientX: 220, clientY: 240 }), 0);
});

test('pointercancel limpia solo el gesto que pertenece a ese puntero', () => {
  assert.equal(typeof scene.beginZoneSwipe, 'function');
  const gesture = scene.beginZoneSwipe({ closest: () => null }, 3, 400, 220);
  assert.equal(scene.cancelPointerGesture(gesture, 4), gesture);
  const canceled = scene.cancelPointerGesture(gesture, 3);
  assert.equal(canceled, null);
  assert.equal(scene.getZoneSwipeDirection(canceled, { pointerId: 3, clientX: 300, clientY: 220 }), 0);
});

test('un arrastre conserva la última posición provisional al terminar o cancelarse', () => {
  assert.equal(typeof scene.createPlantDrag, 'function');
  const gesture = scene.createPlantDrag('plant-1', 11, { zoneId: 'greenhouse', x: 40, y: 78 });
  const preview = { id: 'plant-1', x: 58, y: 74 };
  const expected = {
    id: 'plant-1', zoneId: 'greenhouse', x: 58, y: 74,
  };
  assert.deepEqual(scene.getPlantDragCommit(gesture, preview, { pointerId: 11, type: 'pointerup' }), expected);
  assert.deepEqual(scene.getPlantDragCommit(gesture, preview, { pointerId: 11, type: 'pointercancel' }), expected);
  assert.equal(scene.getPlantDragCommit(gesture, preview, { pointerId: 12, type: 'pointercancel' }), null);
});

test('un movimiento de planta se distingue de un toque', () => {
  assert.equal(typeof scene.hasPlantDragMoved, 'function');
  const gesture = scene.createPlantDrag('plant-1', 4, { zoneId: 'greenhouse', x: 40, y: 78 }, 100, 200);
  assert.equal(scene.hasPlantDragMoved(gesture, { pointerId: 4, clientX: 102, clientY: 202 }), false);
  assert.equal(scene.hasPlantDragMoved(gesture, { pointerId: 4, clientX: 110, clientY: 204 }), true);
  assert.equal(scene.hasPlantDragMoved(gesture, { pointerId: 5, clientX: 180, clientY: 200 }), false);
});

test('las plantas en fases iniciales reciben punteros solo desde su imagen visible', async () => {
  const css = await readFile(new URL('./scene.css', import.meta.url), 'utf8');
  const earlyPlantRules = css.match(/\.spatial-plant\[data-growth-stage="(?:incubating|germinating|seedling)"\][^{]*\{[^}]*\}/g) ?? [];

  assert.ok(earlyPlantRules.some((rule) => /pointer-events:\s*none/.test(rule)));
  assert.ok(earlyPlantRules.some((rule) => /\.plant-cutout/.test(rule) && /pointer-events:\s*auto/.test(rule)));
  assert.ok(earlyPlantRules.some((rule) => /\.plant-stage-art/.test(rule) && /pointer-events:\s*auto/.test(rule)));
});
test('los swipes laterales y el arrastre reservado de plantas conviven en móvil', async () => {
  const css = await readFile(new URL('./scene.css', import.meta.url), 'utf8');
  const gardenRule = css.match(/\.garden-space\s*\{([^}]+)\}/)?.[1] ?? '';
  const arrangeRule = css.match(/\.is-arranging \.spatial-plant\s*\{([^}]+)\}/)?.[1] ?? '';

  assert.match(gardenRule, /touch-action:\s*pan-y/i, 'la escena debe dejar los gestos horizontales a la navegación');
  assert.match(arrangeRule, /touch-action:\s*none/i, 'al organizar, el gesto de la planta debe quedar reservado al arrastre');
});

test('las etiquetas globales separan dos plantas cercanas en una misma fila', () => {
  assert.equal(typeof scene.getPlantCaptionOffsets, 'function');
  const mobilePair = scene.getPlantCaptionOffsets([
    { id: 'left', x: 46, y: 88, width: 21 },
    { id: 'right', x: 50, y: 88, width: 21 },
  ], 375);
  assert.ok(mobilePair.left < 0 && mobilePair.right > 0);
  assert.deepEqual(scene.getPlantCaptionOffsets([
    { id: 'left', x: 26, y: 88, width: 21 },
    { id: 'right', x: 50, y: 88, width: 21 },
  ], 390), {});
  assert.deepEqual(scene.getPlantCaptionOffsets([
    { id: 'left', x: 46, y: 88, width: 9 },
    { id: 'right', x: 58, y: 88, width: 9 },
  ], 1250), {});
  assert.deepEqual(scene.getPlantCaptionOffsets([
    { id: 'left', x: 50, y: 88, width: 10.5 },
    { id: 'right', x: 62, y: 88, width: 9.7 },
  ], 1250), {}, 'el espacio entre etiquetas debe escalar con el viewport');
});

test('las etiquetas globales distribuyen tres plantas cercanas sin cruzarse', () => {
  assert.equal(typeof scene.getPlantCaptionOffsets, 'function');
  const offsets = scene.getPlantCaptionOffsets([
    { id: 'first', x: 46, y: 88, width: 21 },
    { id: 'middle', x: 50, y: 88, width: 21 },
    { id: 'last', x: 54, y: 88, width: 21 },
  ], 375);
  const centers = [
    46 + offsets.first / 375 * 100,
    50 + (offsets.middle ?? 0) / 375 * 100,
    54 + offsets.last / 375 * 100,
  ];

  assert.ok(centers[0] < 35 && centers[1] > 35 && centers[2] > 65);
  assert.ok(centers[1] - centers[0] > 22);
  assert.ok(centers[2] - centers[1] > 22);
});

test('las etiquetas de cinco plantas cercanas se distribuyen en filas sin cruzarse', () => {
  assert.equal(typeof scene.getPlantCaptionLayout, 'function');
  const plants = [
    { id: 'front-left', x: 26, y: 88, width: 21 },
    { id: 'back-left', x: 26, y: 82, width: 21 },
    { id: 'long-name', x: 32, y: 83, width: 21 },
    { id: 'center', x: 50, y: 88, width: 21 },
    { id: 'right', x: 72, y: 88, width: 21 },
  ];
  const layout = scene.getPlantCaptionLayout(plants, 390, 60, 480);
  const rows = new Map();
  for (const plant of plants) {
    assert.ok(Number.isFinite(layout[plant.id]?.x), `falta posición horizontal para ${plant.id}`);
    assert.ok(Number.isFinite(layout[plant.id]?.y), `falta fila para ${plant.id}`);
    const baseline = Number((plant.y / 100 * 480 + layout[plant.id].y).toFixed(2));
    const row = rows.get(baseline) ?? [];
    row.push({ ...plant, center: plant.x + layout[plant.id].x / 390 * 100 });
    rows.set(baseline, row);
    assert.ok(row.at(-1).center - plant.width / 2 >= 2 && row.at(-1).center + plant.width / 2 <= 98, `${plant.id} debe quedar dentro de la escena`);
  }

  assert.ok(rows.size >= 2, 'un grupo ancho debe usar más de una fila');
  for (const row of rows.values()) {
    row.sort((first, second) => first.center - second.center);
    for (let index = 1; index < row.length; index += 1) {
      const previous = row[index - 1];
      const current = row[index];
      const requiredGap = (previous.width + current.width) / 2 + 8 / 390 * 100;
      assert.ok(current.center - previous.center >= requiredGap - 0.1, 'las tarjetas en una fila no deben tocarse');
      assert.ok(previous.center - previous.width / 2 >= 2, 'la fila debe conservar margen izquierdo');
      assert.ok(current.center + current.width / 2 <= 98, 'la fila debe conservar margen derecho');
    }
  }
});
test('las etiquetas no vuelven a cruzarse con una planta vecina tras redistribuir el grupo', () => {
  const plants = [
    { id: 'front-left', x: 26, y: 88, width: 21 },
    { id: 'back-left', x: 26, y: 82, width: 21 },
    { id: 'long-name', x: 32, y: 82.67, width: 21 },
    { id: 'center', x: 50, y: 88, width: 21 },
    { id: 'right', x: 74, y: 88, width: 21 },
  ];
  const layout = scene.getPlantCaptionLayout(plants, 390, 60, 480);
  const placed = plants.map((plant) => {
    const caption = layout[plant.id] ?? { x: 0, y: 0 };
    return {
      ...plant,
      centerX: plant.x + caption.x / 390 * 100,
      centerY: plant.y / 100 * 480 + caption.y,
    };
  });

  for (let first = 0; first < placed.length; first += 1) {
    for (let second = first + 1; second < placed.length; second += 1) {
      const a = placed[first];
      const b = placed[second];
      const horizontalOverlap = Math.abs(a.centerX - b.centerX) < (a.width + b.width) / 2 + 8 / 390 * 100;
      if (horizontalOverlap) assert.ok(Math.abs(a.centerY - b.centerY) >= 60, `${a.id} y ${b.id} no deben compartir la misma fila`);
    }
  }
});
test('la fila considera etiquetas altas con nombres largos al separar tarjetas vecinas', () => {
  const plants = [
    { id: 'long-name', x: 40, y: 88, width: 35, height: 74 },
    { id: 'short-name', x: 42, y: 88, width: 35, height: 34 },
  ];
  const layout = scene.getPlantCaptionLayout(plants, 390, 60, 480);
  const longBaseline = plants[0].y / 100 * 480 + layout['long-name'].y;
  const shortBaseline = plants[1].y / 100 * 480 + layout['short-name'].y;

  assert.ok(
    shortBaseline + plants[1].height + 8 <= longBaseline || longBaseline + plants[0].height + 8 <= shortBaseline,
    'las tarjetas deben quedar separadas considerando la altura de ambas',
  );
});
test('cinco nombres de semilla caben en móvil cuando se muestran los detalles globales', () => {
  const names = ['Estirar · QA', 'Un resumen breve', 'Leer una página y quedarme con una idea importante', 'Leer 5 minutos · QA', 'Caminar 10 minutos · QA'];
  const plants = [
    { id: 'left', x: 26, y: 88 },
    { id: 'back-left', x: 26, y: 82 },
    { id: 'long', x: 32, y: 82.67 },
    { id: 'center', x: 50, y: 88 },
    { id: 'right', x: 74, y: 88 },
  ].map((plant, index) => {
    const width = scene.getPlantCaptionWidthPercent(names[index], 'Semilla · incubación', 390, 390) * 390 / 100;
    return {
      ...plant,
      width: width / 390 * 100,
      height: scene.getPlantCaptionHeightPx(names[index], 'Semilla · incubación', 390, width),
    };
  });
  const layout = scene.getPlantCaptionLayout(plants, 390, 60, 480);

  for (let first = 0; first < plants.length; first += 1) {
    for (let second = first + 1; second < plants.length; second += 1) {
      const a = plants[first];
      const b = plants[second];
      const centerA = a.x + layout[a.id].x / 390 * 100;
      const centerB = b.x + layout[b.id].x / 390 * 100;
      const overlapsHorizontally = Math.abs(centerA - centerB) < (a.width + b.width) / 2 + 8 / 390 * 100;
      if (!overlapsHorizontally) continue;
      const topA = a.y / 100 * 480 + layout[a.id].y;
      const topB = b.y / 100 * 480 + layout[b.id].y;
      assert.ok(topA + a.height + 8 <= topB || topB + b.height + 8 <= topA, `${a.id} y ${b.id} no deben superponerse`);
    }
  }
});
test('la altura estimada de la etiqueta aumenta con el nombre y el ajuste móvil', () => {
  assert.equal(typeof scene.getPlantCaptionHeightPx, 'function');
  const short = scene.getPlantCaptionHeightPx('Caminar', 'Semilla · incubación', 390, 78);
  const long = scene.getPlantCaptionHeightPx('Leer una página y quedarme con una idea importante', 'Semilla · incubación', 390, 78);

  assert.ok(long > short + 20, `la tarjeta larga debe reservar más alto (${short}px → ${long}px)`);
});
test('el ancho de etiqueta usa el límite móvil y el texto real en escritorio', () => {
  assert.equal(typeof scene.getPlantCaptionWidthPercent, 'function');
  const mobileWidth = scene.getPlantCaptionWidthPercent('Movilidad breve', 'Semilla · incubación', 390, 375);
  const desktopWidth = scene.getPlantCaptionWidthPercent('Movilidad breve', 'Semilla · incubación', 1280, 1250);

  assert.ok(mobileWidth > 20 && mobileWidth < 23, `ancho móvil calculado: ${mobileWidth.toFixed(1)}%`);
  assert.ok(desktopWidth > 8 && desktopWidth < 10, `ancho escritorio calculado: ${desktopWidth.toFixed(1)}%`);
});

test('la escena desplaza hacia fuera las etiquetas de una pareja cercana', async () => {
  const component = await readFile(new URL('./components/SpatialGarden.jsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('./scene.css', import.meta.url), 'utf8');

  assert.match(component, /getPlantCaptionLayout/);
  assert.match(component, /getPlantCaptionHeightPx/);
  assert.match(component, /captionStageHeight/);
  assert.match(component, /--caption-row-offset/);
  assert.match(css, /left:\s*calc\(50% \+ var\(--caption-offset, 0px\)\)/);
  assert.match(css, /translateY\(var\(--caption-row-offset, 0px\)\)/);
  assert.match(css, /width:\s*max-content/);
});

test('el layout reajusta los rótulos al cambiar el ancho de ventana', async () => {
  const component = await readFile(new URL('./components/SpatialGarden.jsx', import.meta.url), 'utf8');

  assert.match(component, /addEventListener\('resize', updateViewportWidth\)/);
  assert.match(component, /removeEventListener\('resize', updateViewportWidth\)/);
});

test('los nombres largos de planta pueden ocupar dos líneas en móvil', async () => {
  const css = await readFile(new URL('./scene.css', import.meta.url), 'utf8');
  const captionRule = css.match(/\.plant-caption\s*\{([^}]+)\}/)?.[1] ?? '';
  const nameRule = css.match(/\.plant-caption-name\s*\{([^}]+)\}/)?.[1] ?? '';
  const stageRule = css.match(/\.plant-stage-label\s*\{([^}]+)\}/)?.[1] ?? '';

  assert.match(captionRule, /white-space:\s*normal/i);
  assert.match(nameRule, /white-space:\s*normal/i);
  assert.match(stageRule, /white-space:\s*normal/i);
});

test('la vista global de detalles despeja la instrucción inferior', async () => {
  const css = await readFile(new URL('./scene.css', import.meta.url), 'utf8');
  const rule = css.match(/\.show-plant-details\s+\.scene-instruction\s*\{([^}]+)\}/)?.[1] ?? '';

  assert.match(rule, /display:\s*none/i, 'la ayuda fija no debe cruzarse con las etiquetas de las plantas');
});

test('el texto de la escena no se selecciona al hacer un gesto lateral', async () => {
  const css = await readFile(new URL('./scene.css', import.meta.url), 'utf8');
  const rule = css.match(/\.garden-space\s*\{([^}]+)\}/)?.[1] ?? '';

  assert.match(rule, /-webkit-user-select:\s*none/i, 'Safari móvil no debe seleccionar el texto bajo el gesto');
  assert.match(rule, /user-select:\s*none/i, 'la escena debe reservar los arrastres para navegación y movimiento');
});
