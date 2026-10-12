import test from 'node:test';
import assert from 'node:assert/strict';
import { TUTORIAL_KEY, readTutorialStatus, writeTutorialStatus, shouldAutoOpen, getStorage } from './persist.js';
import { createFlow, next, prev, isFirst, isLast, progressLabel, progressPercent } from './flow.js';
import { computeCardPosition, unionRect, padRect, overlapArea, isInside } from './position.js';
import { STEPS, availableSteps } from './steps.js';

const memoryStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
};
const blocked = () => ({
  getItem() { throw new Error('bloqueado'); },
  setItem() { throw new Error('bloqueado'); },
});

test('la clave de almacenamiento es la acordada', () => {
  assert.equal(TUTORIAL_KEY, 'kairos_montessori_tutorial_v1');
});

test('persistencia: primera vez abre solo; después de ver o saltar, no', () => {
  const s = memoryStorage();
  assert.equal(shouldAutoOpen(s), true);
  assert.equal(writeTutorialStatus(s, 'skipped'), true);
  assert.equal(readTutorialStatus(s), 'skipped');
  assert.equal(shouldAutoOpen(s), false);
  writeTutorialStatus(s, 'done');
  assert.equal(readTutorialStatus(s), 'done');
  assert.equal(shouldAutoOpen(s), false);
});

test('persistencia: valores desconocidos se ignoran y no se guardan estados inválidos', () => {
  const s = memoryStorage();
  s.setItem(TUTORIAL_KEY, 'cualquier-cosa');
  assert.equal(readTutorialStatus(s), null);
  assert.equal(writeTutorialStatus(s, 'raro'), false);
  assert.equal(s.getItem(TUTORIAL_KEY), 'cualquier-cosa');
});

test('persistencia: con almacenamiento bloqueado o ausente nada lanza', () => {
  assert.equal(readTutorialStatus(blocked()), null);
  assert.equal(writeTutorialStatus(blocked(), 'done'), false);
  assert.equal(shouldAutoOpen(blocked()), true);
  assert.equal(readTutorialStatus(null), null);
  assert.equal(writeTutorialStatus(undefined, 'done'), false);
  assert.equal(getStorage(), null); // sin window (Node)
});

test('flujo: avanza, retrocede y termina sin salirse de los límites', () => {
  let f = createFlow(3);
  assert.ok(isFirst(f) && !isLast(f));
  assert.equal(prev(f), f);
  f = next(f);
  assert.equal(f.index, 1);
  assert.equal(progressLabel(f), 'Paso 2 de 3');
  f = next(f);
  assert.ok(isLast(f) && !f.finished);
  assert.equal(progressPercent(f), 100);
  f = next(f);
  assert.equal(f.finished, true);
  assert.equal(f.index, 2);
  assert.equal(next(f), f);
  assert.equal(prev(f), f);
});

test('flujo: retroceder desde un paso intermedio', () => {
  const f = prev(next(next(createFlow(5))));
  assert.equal(f.index, 1);
  assert.equal(progressPercent(createFlow(0)), 0);
  assert.equal(progressLabel(createFlow(0)), 'Paso 0 de 0');
});

test('pasos: ids únicos, textos en español no vacíos y objetivos con marca', () => {
  const ids = STEPS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of STEPS) {
    assert.ok(s.title.length > 0 && s.text.length > 20, s.id);
    assert.ok(s.target && /^[a-z-]+$/.test(s.target), s.id);
  }
});

test('pasos: availableSteps omite los que no tienen elemento', () => {
  const have = new Set(['clock', 'tray']);
  const out = availableSteps(STEPS, (s) => have.has(s.target));
  assert.deepEqual(out.map((s) => s.id), ['tray', 'clock']);
  assert.equal(availableSteps([{ id: 'x', title: 't' }], () => false).length, 1); // sin target: siempre
});

const VP = { width: 390, height: 844 };
const card = { width: 340, height: 210 };

test('posición: sin elemento la tarjeta va al centro', () => {
  const p = computeCardPosition({ target: null, card, viewport: VP });
  assert.equal(p.placement, 'center');
  assert.ok(isInside(p, VP));
  assert.equal(p.left, 25);
});

test('posición: elemento arriba -> la tarjeta va debajo y sin taparlo', () => {
  const target = { top: 10, left: 10, width: 370, height: 60 };
  const p = computeCardPosition({ target, card, viewport: VP });
  assert.equal(p.placement, 'bottom');
  assert.equal(overlapArea(p, target), 0);
  assert.ok(isInside(p, VP));
});

test('posición: elemento abajo -> la tarjeta va arriba', () => {
  const target = { top: 760, left: 10, width: 370, height: 70 };
  const p = computeCardPosition({ target, card, viewport: VP });
  assert.equal(p.placement, 'top');
  assert.equal(overlapArea(p, target), 0);
  assert.ok(isInside(p, VP));
});

test('posición: en horizontal prefiere el costado cuando arriba y abajo no caben', () => {
  const vp = { width: 844, height: 390 };
  const target = { top: 20, left: 10, width: 300, height: 350 };
  const p = computeCardPosition({ target, card: { width: 340, height: 200 }, viewport: vp });
  assert.equal(p.placement, 'right');
  assert.equal(overlapArea(p, target), 0);
  assert.ok(isInside(p, vp));
});

test('posición: elemento enorme -> la tarjeta queda dentro de la ventana, tapándolo lo mínimo', () => {
  const target = { top: 80, left: 6, width: 378, height: 640 };
  const p = computeCardPosition({ target, card, viewport: VP });
  assert.ok(isInside(p, VP));
  assert.ok(overlapArea(p, target) < p.width * p.height); // no lo tapa por completo
});

test('posición: tarjeta más grande que la ventana se encoge a la ventana', () => {
  const vp = { width: 300, height: 200 };
  const p = computeCardPosition({ target: { top: 50, left: 50, width: 50, height: 50 }, card: { width: 400, height: 500 }, viewport: vp });
  assert.ok(isInside(p, vp));
  assert.equal(p.width, 276);
  assert.equal(p.height, 176);
});

test('posición: cualquier elemento en cualquier ventana deja la tarjeta dentro', () => {
  const viewports = [{ width: 390, height: 844 }, { width: 360, height: 800 }, { width: 844, height: 390 }, { width: 1440, height: 900 }];
  for (const vp of viewports) {
    for (let i = 0; i < 40; i++) {
      const target = { top: (i * 37) % vp.height, left: (i * 53) % vp.width, width: 20 + ((i * 29) % vp.width), height: 20 + ((i * 41) % vp.height) };
      const p = computeCardPosition({ target, card, viewport: vp });
      assert.ok(isInside(p, vp), JSON.stringify({ vp, target, p }));
    }
  }
});

test('geometría: unión, relleno recortado y solape', () => {
  const u = unionRect([{ top: 10, left: 10, width: 10, height: 10 }, null, { top: 30, left: 40, width: 10, height: 10 }]);
  assert.deepEqual(u, { top: 10, left: 10, width: 40, height: 30 });
  assert.equal(unionRect([]), null);
  const pr = padRect({ top: 2, left: 2, width: 100, height: 100 }, 6, { width: 104, height: 300 });
  assert.deepEqual(pr, { top: 0, left: 0, width: 104, height: 108 });
  assert.equal(overlapArea({ top: 0, left: 0, width: 10, height: 10 }, { top: 10, left: 0, width: 10, height: 10 }), 0);
  assert.equal(overlapArea({ top: 0, left: 0, width: 10, height: 10 }, { top: 5, left: 5, width: 10, height: 10 }), 25);
});
