import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TUTORIAL_KEY, readTutorialStatus, writeTutorialStatus, shouldAutoOpen, getStorage } from './persist.js';
import { createFlow, next, prev, isFirst, isLast, progressLabel, progressFraction } from './flow.js';
import { unionRect, padRect, overlapArea, computeCardPosition, isInside, scrollDeltaToReveal, isComfortable } from './position.js';
import { STEPS, TABS } from './steps.js';
import { planView, planExit } from './plan.js';

const memoryStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
};
const brokenStorage = () => ({
  getItem() { throw new Error('bloqueado'); },
  setItem() { throw new Error('bloqueado'); },
});

// ---------- persistencia ----------
test('persistencia: la clave es propia del prototipo', () => {
  assert.equal(TUTORIAL_KEY, 'kairos_pomodoro_tutorial_v1');
});

test('persistencia: sin nada guardado el tutorial se abre solo', () => {
  assert.equal(readTutorialStatus(memoryStorage()), null);
  assert.equal(shouldAutoOpen(memoryStorage()), true);
});

test('persistencia: visto o saltado se recuerda y ya no se abre solo', () => {
  for (const status of ['done', 'skipped']) {
    const s = memoryStorage();
    assert.equal(writeTutorialStatus(s, status), true);
    assert.equal(readTutorialStatus(s), status);
    assert.equal(shouldAutoOpen(s), false);
  }
});

test('persistencia: un valor desconocido se ignora y no se guarda', () => {
  const s = memoryStorage();
  s.setItem(TUTORIAL_KEY, 'cualquier-cosa');
  assert.equal(readTutorialStatus(s), null);
  assert.equal(writeTutorialStatus(s, 'otro'), false);
});

test('persistencia: si el almacenamiento falla o no existe, no lanza', () => {
  assert.equal(readTutorialStatus(brokenStorage()), null);
  assert.equal(writeTutorialStatus(brokenStorage(), 'done'), false);
  assert.equal(shouldAutoOpen(brokenStorage()), true);
  assert.equal(readTutorialStatus(null), null);
  assert.equal(writeTutorialStatus(null, 'done'), false);
  assert.equal(getStorage(), null); // en Node no hay window
});

// ---------- avance ----------
test('avance: recorre los pasos y termina al pasar el último', () => {
  let f = createFlow(3);
  assert.equal(progressLabel(f), 'Paso 1 de 3');
  assert.ok(isFirst(f) && !isLast(f));
  f = next(f);
  f = next(f);
  assert.ok(isLast(f));
  assert.equal(progressLabel(f), 'Paso 3 de 3');
  assert.equal(f.finished, false);
  f = next(f);
  assert.equal(f.finished, true);
  assert.equal(next(f), f);
  assert.equal(prev(f), f);
});

test('avance: Anterior no baja del primer paso', () => {
  const f = createFlow(4);
  assert.equal(prev(f), f);
  assert.equal(prev(next(f)).index, 0);
});

test('avance: la barra de progreso va de 1/n a 1 y soporta 0 pasos', () => {
  const f = createFlow(4);
  assert.equal(progressFraction(f), 0.25);
  assert.equal(progressFraction(next(next(next(f)))), 1);
  assert.equal(progressFraction(createFlow(0)), 0);
  assert.equal(progressLabel(createFlow(0)), 'Paso 0 de 0');
});

// ---------- posición ----------
const VIEWS = [{ width: 390, height: 844 }, { width: 360, height: 800 }, { width: 844, height: 390 }, { width: 1440, height: 900 }];

test('posición: unión y relleno de rectángulos', () => {
  assert.equal(unionRect([null, undefined]), null);
  assert.deepEqual(unionRect([{ top: 10, left: 10, width: 20, height: 20 }, { top: 50, left: 0, width: 10, height: 10 }]), { top: 10, left: 0, width: 30, height: 50 });
  assert.deepEqual(padRect({ top: 2, left: 2, width: 10, height: 10 }, 6, { width: 100, height: 100 }), { top: 0, left: 0, width: 18, height: 18 });
  assert.equal(overlapArea({ top: 0, left: 0, width: 10, height: 10 }, { top: 20, left: 20, width: 5, height: 5 }), 0);
});

test('posición: la tarjeta siempre cae dentro de la pantalla, sin importar dónde esté el elemento', () => {
  const card = { width: 360, height: 230 };
  for (const viewport of VIEWS) {
    for (const top of [0, 100, viewport.height - 60, viewport.height - 5]) {
      for (const left of [0, viewport.width / 2, viewport.width - 40]) {
        for (const size of [{ width: 40, height: 40 }, { width: viewport.width, height: viewport.height * 0.8 }]) {
          const target = { top, left: Math.min(left, viewport.width - 1), ...size };
          const pos = computeCardPosition({ target, card, viewport });
          assert.ok(isInside(pos, viewport), `fuera de pantalla ${JSON.stringify({ viewport, target, pos })}`);
        }
      }
    }
  }
});

test('posición: prefiere no tapar el elemento y se centra si no hay elemento', () => {
  const viewport = { width: 390, height: 844 };
  const card = { width: 340, height: 200 };
  const small = { top: 100, left: 20, width: 100, height: 50 };
  const pos = computeCardPosition({ target: small, card, viewport });
  assert.equal(overlapArea(pos, small), 0);
  const centered = computeCardPosition({ target: null, card, viewport });
  assert.equal(centered.placement, 'center');
  assert.ok(isInside(centered, viewport));
});

test('posición: una tarjeta más ancha que la pantalla se encoge', () => {
  const viewport = { width: 320, height: 640 };
  const pos = computeCardPosition({ target: null, card: { width: 360, height: 200 }, viewport });
  assert.ok(pos.width <= viewport.width - 24);
  assert.ok(isInside(pos, viewport));
});

test('posición: se desplaza para dejar lo resaltado arriba solo si caben él y la tarjeta', () => {
  const viewport = { width: 390, height: 844 };
  assert.equal(scrollDeltaToReveal({ target: null, cardHeight: 240, viewport }), null);
  assert.equal(scrollDeltaToReveal({ target: { top: 500, left: 0, width: 300, height: 150 }, cardHeight: 240, viewport }), 482);
  assert.equal(scrollDeltaToReveal({ target: { top: 5, left: 0, width: 300, height: 150 }, cardHeight: 240, viewport }), -13);
  assert.equal(scrollDeltaToReveal({ target: { top: 100, left: 0, width: 300, height: 700 }, cardHeight: 240, viewport }), null);
});

test('posición: no se desplaza nada si ya se ve completo y la tarjeta cabe sin taparlo', () => {
  const viewport = { width: 1440, height: 900 };
  const card = { width: 360, height: 230 };
  assert.equal(isComfortable({ target: null, card, viewport }), true);
  assert.equal(isComfortable({ target: { top: 100, left: 300, width: 400, height: 200 }, card, viewport }), true);
  // cortado por abajo
  assert.equal(isComfortable({ target: { top: 800, left: 300, width: 400, height: 200 }, card, viewport }), false);
  // completo pero tan alto que la tarjeta lo taparía
  assert.equal(isComfortable({ target: { top: 10, left: 10, width: 1420, height: 880 }, card, viewport }), false);
});

// ---------- pasos ----------
test('pasos: ids únicos, textos completos y pestañas válidas', () => {
  const ids = STEPS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of STEPS) {
    assert.ok(s.title && s.title.length <= 40, `título de ${s.id}`);
    assert.ok(s.text && s.text.length <= 200, `texto de ${s.id} (${s.text.length})`);
    assert.ok(s.tab === null || TABS.includes(s.tab), `pestaña de ${s.id}`);
    assert.ok(s.target === null || /^[a-z-]+$/.test(s.target), `marca de ${s.id}`);
  }
  assert.equal(STEPS.find((s) => s.target === null).id, 'welcome');
});

test('pasos: cubren las tres pestañas y la sesión de muestra solo se pide en el temporizador', () => {
  for (const tab of TABS) assert.ok(STEPS.some((s) => s.tab === tab), `sin pasos en la pestaña ${tab}`);
  for (const s of STEPS.filter((x) => x.demo)) assert.equal(s.tab, 1);
  assert.equal(STEPS.at(-1).id, 'help');
});

// ---------- plan de vistas ----------
const byId = (id) => STEPS.find((s) => s.id === id);

test('plan: un paso de Configurar solo cambia de pestaña si hace falta', () => {
  const step = byId('presets');
  assert.deepEqual(planView({ step, sessionActive: false, demoStarted: false, tab: 0 }), { startDemo: false, stopDemo: false, setTab: null });
  assert.equal(planView({ step, sessionActive: false, demoStarted: false, tab: 2 }).setTab, 0);
});

test('plan: el temporizador sin sesión inicia una de muestra; con sesión propia no la toca', () => {
  const step = byId('timer-arc');
  assert.deepEqual(planView({ step, sessionActive: false, demoStarted: false, tab: 0 }), { startDemo: true, stopDemo: false, setTab: 1 });
  assert.deepEqual(planView({ step, sessionActive: true, demoStarted: false, tab: 0 }), { startDemo: false, stopDemo: false, setTab: 1 });
  // ya iniciada por el tutorial: no se vuelve a iniciar
  assert.deepEqual(planView({ step, sessionActive: true, demoStarted: true, tab: 1 }), { startDemo: false, stopDemo: false, setTab: null });
});

test('plan: al salir del temporizador la sesión de muestra se descarta y se pide la pestaña del paso', () => {
  const plan = planView({ step: byId('stats-goal'), sessionActive: true, demoStarted: true, tab: 1 });
  assert.deepEqual(plan, { startDemo: false, stopDemo: true, setTab: 2 });
  // sin sesión de muestra no se descarta nada (puede ser una sesión real de la persona)
  assert.equal(planView({ step: byId('stats-goal'), sessionActive: true, demoStarted: false, tab: 1 }).stopDemo, false);
});

test('plan: el paso final no cambia de pestaña, salvo para restaurar tras descartar la sesión', () => {
  const step = byId('help');
  assert.equal(planView({ step, sessionActive: false, demoStarted: false, tab: 2 }).setTab, null);
  assert.deepEqual(planView({ step, sessionActive: true, demoStarted: true, tab: 1 }), { startDemo: false, stopDemo: true, setTab: 1 });
});

test('plan de salida: descarta la sesión de muestra y vuelve a la pestaña inicial', () => {
  assert.deepEqual(planExit({ demoStarted: true, initialTab: 0, tab: 1 }), { stopDemo: true, setTab: 0 });
  assert.deepEqual(planExit({ demoStarted: false, initialTab: 1, tab: 2 }), { stopDemo: false, setTab: 1 });
  assert.deepEqual(planExit({ demoStarted: false, initialTab: 0, tab: 0 }), { stopDemo: false, setTab: null });
});
