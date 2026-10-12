import test from 'node:test';
import assert from 'node:assert/strict';
import { TUTORIAL_STEPS, sceneSignature } from './steps.js';
import { clampIndex, isFirstStep, isLastStep, nextIndex, previousIndex, progressLabel } from './flow.js';
import { markTutorialSeen, readTutorialStatus, shouldAutoStart, TUTORIAL_STORAGE_KEY } from './storage.js';
import { computeCardPosition, isRectVisible, padRect, unionRects } from './position.js';
import { createTutorialGarden } from './sampleGarden.js';
import { assertValidGarden } from '../state.js';
import { STORAGE_KEY } from '../persistence.js';

const memoryStorage = () => {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), data };
};
const throwing = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };

test('la clave del tutorial no choca con la de datos del jardín', () => {
  assert.equal(TUTORIAL_STORAGE_KEY, 'kairos_kaizen_tutorial_v1');
  assert.notEqual(TUTORIAL_STORAGE_KEY, STORAGE_KEY);
});

test('los pasos tienen id único, título, texto y escena', () => {
  const ids = new Set(TUTORIAL_STEPS.map(({ id }) => id));
  assert.equal(ids.size, TUTORIAL_STEPS.length);
  for (const step of TUTORIAL_STEPS) {
    assert.ok(step.title && step.body, step.id);
    assert.ok(step.target === null || (Array.isArray(step.target) && step.target.length > 0), step.id);
    assert.ok(['garden', 'new', 'nursery', 'herbarium', 'settings'].includes(step.scene.view), step.id);
  }
  assert.equal(sceneSignature(TUTORIAL_STEPS[4]), sceneSignature({ scene: { ...TUTORIAL_STEPS[4].scene } }));
  assert.notEqual(sceneSignature(TUTORIAL_STEPS[4]), sceneSignature(TUTORIAL_STEPS[3]));
});

test('avance y retroceso se mantienen dentro del rango', () => {
  assert.equal(nextIndex(0, 5), 1);
  assert.equal(nextIndex(4, 5), 4);
  assert.equal(previousIndex(0, 5), 0);
  assert.equal(previousIndex(3, 5), 2);
  assert.equal(clampIndex(NaN, 5), 0);
  assert.equal(clampIndex(99, 5), 4);
  assert.ok(isFirstStep(0) && !isFirstStep(1));
  assert.ok(isLastStep(4, 5) && !isLastStep(3, 5));
  assert.equal(progressLabel(1, 7), 'Paso 2 de 7');
});

test('la persistencia recuerda visto u omitido', () => {
  const storage = memoryStorage();
  assert.equal(readTutorialStatus(storage), null);
  assert.equal(shouldAutoStart(storage), true);
  assert.equal(markTutorialSeen('skipped', storage), true);
  assert.equal(storage.data.get(TUTORIAL_STORAGE_KEY), 'skipped');
  assert.equal(readTutorialStatus(storage), 'skipped');
  assert.equal(shouldAutoStart(storage), false);
  assert.equal(markTutorialSeen('done', storage), true);
  assert.equal(readTutorialStatus(storage), 'done');
  assert.equal(markTutorialSeen('otro', storage), false);
  storage.setItem(TUTORIAL_STORAGE_KEY, 'basura');
  assert.equal(readTutorialStatus(storage), null);
});

test('si el almacenamiento falla no lanza ni se abre solo', () => {
  assert.equal(readTutorialStatus(throwing), undefined);
  assert.equal(shouldAutoStart(throwing), false);
  assert.equal(markTutorialSeen('done', throwing), false);
});

test('unionRects y padRect', () => {
  assert.equal(unionRects([]), null);
  assert.equal(unionRects([{ left: 0, top: 0, width: 0, height: 5 }]), null);
  assert.deepEqual(unionRects([{ left: 10, top: 10, width: 10, height: 10 }, { left: 40, top: 5, width: 10, height: 10 }]), { left: 10, top: 5, width: 40, height: 15 });
  assert.deepEqual(padRect({ left: 2, top: 2, width: 100, height: 50 }, { width: 100, height: 60 }, 6), { left: 0, top: 0, width: 100, height: 58 });
  assert.ok(isRectVisible({ left: 0, top: 0, width: 10, height: 10 }, { width: 100, height: 100 }));
  assert.ok(!isRectVisible({ left: 0, top: 200, width: 10, height: 10 }, { width: 100, height: 100 }));
});

function assertInside(pos, viewport, margin = 12) {
  assert.ok(pos.left >= margin - 0.01, `left ${pos.left}`);
  assert.ok(pos.top >= margin - 0.01, `top ${pos.top}`);
  assert.ok(pos.left + pos.width <= viewport.width - margin + 0.01, `right ${pos.left + pos.width}`);
  assert.ok(pos.top + pos.height <= viewport.height - margin + 0.01, `bottom ${pos.top + pos.height}`);
}

test('la tarjeta sin objetivo queda centrada', () => {
  const viewport = { width: 390, height: 844 };
  const pos = computeCardPosition({ target: null, card: { width: 350, height: 240 }, viewport });
  assert.equal(pos.placement, 'center');
  assertInside(pos, viewport);
});

test('la tarjeta prefiere el lado pedido y cae al opuesto si no cabe', () => {
  const viewport = { width: 1440, height: 900 };
  const card = { width: 360, height: 220 };
  const middle = { left: 500, top: 300, width: 200, height: 100 };
  assert.equal(computeCardPosition({ target: middle, card, viewport, prefer: 'bottom' }).placement, 'bottom');
  assert.equal(computeCardPosition({ target: middle, card, viewport, prefer: 'right' }).placement, 'right');
  const low = { left: 500, top: 780, width: 200, height: 100 };
  assert.equal(computeCardPosition({ target: low, card, viewport, prefer: 'bottom' }).placement, 'top');
});

test('junto a un objetivo ancho la tarjeta se estrecha para caber al lado en pantallas grandes', () => {
  const viewport = { width: 1440, height: 900 };
  const wide = { left: 330, top: 30, width: 780, height: 800 };
  const pos = computeCardPosition({ target: wide, card: { width: 360, height: 220 }, viewport, prefer: 'right' });
  assert.equal(pos.placement, 'right');
  assert.ok(pos.width >= 300 && pos.width < 360);
  assertInside(pos, viewport);
  const phone = computeCardPosition({ target: { left: 11, top: 32, width: 368, height: 780 }, card: { width: 360, height: 220 }, viewport: { width: 390, height: 844 }, prefer: 'right' });
  assert.equal(phone.placement, 'overlay');
});

test('la tarjeta siempre cae dentro de la pantalla, incluso con objetivos enormes o en los bordes', () => {
  const sizes = [{ width: 390, height: 844 }, { width: 360, height: 800 }, { width: 844, height: 390 }, { width: 1440, height: 900 }, { width: 320, height: 480 }];
  const targets = [
    { left: 0, top: 0, width: 50, height: 50 },
    { left: 300, top: 700, width: 80, height: 100 },
    { left: 0, top: 70, width: 390, height: 400 },
    { left: 0, top: 0, width: 5000, height: 5000 },
    { left: -50, top: -50, width: 100, height: 100 },
    null,
  ];
  for (const viewport of sizes) {
    for (const target of targets) {
      for (const prefer of ['top', 'bottom', 'left', 'right']) {
        const pos = computeCardPosition({ target: target && padRect(target, viewport), card: { width: 360, height: 260 }, viewport, prefer });
        assertInside(pos, viewport);
      }
    }
  }
});

test('una tarjeta mayor que la pantalla se reduce a los márgenes', () => {
  const viewport = { width: 320, height: 200 };
  const pos = computeCardPosition({ target: { left: 10, top: 10, width: 50, height: 50 }, card: { width: 500, height: 600 }, viewport });
  assert.equal(pos.width, 296);
  assert.equal(pos.height, 176);
  assertInside(pos, viewport);
});

test('el jardín de ejemplo es válido, está solo en memoria y no toca almacenamiento', () => {
  const now = new Date('2026-10-12T15:00:00');
  const garden = createTutorialGarden('plants', now);
  assertValidGarden(garden);
  assert.equal(garden.plants.length, 3);
  assert.equal(garden.herbarium.length, 1);
  assert.deepEqual(garden.plants.map(({ id }) => id).slice(0, 1), ['tour-resumir']);
  const empty = createTutorialGarden('empty', now);
  assertValidGarden(empty);
  assert.equal(empty.plants.length, 0);
  assert.equal(createTutorialGarden('plants', now).plants[0].lastCareDay, null);
});
