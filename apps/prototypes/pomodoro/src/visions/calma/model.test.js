import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSegments, buildTimeline, cameFromBreak, currentSegmentIndex, estimatedEndMs, formatClock, formatDuration, plannedStudyMinutes, quedan } from './model.js';

const base = (o = {}) => ({
  activeBlocks: [1, 2, 3, 4, 5].map((index) => ({ index })),
  activeConfig: { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 },
  currentBlockIndex: 1,
  currentPhase: 'FOCUS',
  secondsRemaining: 1500,
  phaseTotalSeconds: 1500,
  ...o,
});

test('los segmentos alternan módulo y descanso, con descanso largo tras el bloque 4', () => {
  const segs = buildSegments(base());
  assert.equal(segs.length, 9);
  assert.deepEqual(segs.map((s) => s.kind).slice(0, 4), ['block', 'break', 'block', 'break']);
  assert.equal(segs[1].minutes, 5);
  assert.equal(segs[7].minutes, 15);
  assert.equal(segs[8].kind, 'block');
});

test('un solo módulo no tiene descansos', () => {
  assert.deepEqual(buildSegments(base({ activeBlocks: [{ index: 1 }] })).map((s) => s.kind), ['block']);
});

test('el índice del segmento actual sigue bloque y fase', () => {
  assert.equal(currentSegmentIndex(base()), 0);
  assert.equal(currentSegmentIndex(base({ currentPhase: 'SHORT_BREAK' })), 1);
  assert.equal(currentSegmentIndex(base({ currentBlockIndex: 3 })), 4);
  assert.equal(currentSegmentIndex(base({ currentBlockIndex: 4, currentPhase: 'LONG_BREAK' })), 7);
});

test('la línea llena lo pasado, parte de lo actual y deja vacío lo futuro', () => {
  const t = buildTimeline(base({ currentBlockIndex: 2, secondsRemaining: 750 }));
  assert.equal(t[0].fill, 1);
  assert.equal(t[1].fill, 1);
  assert.equal(t[2].fill, 0.5);
  assert.equal(t[2].current, true);
  assert.equal(t[3].fill, 0);
  assert.equal(buildTimeline(base({ secondsRemaining: 0 }))[0].fill, 1);
  assert.equal(buildTimeline(base({ phaseTotalSeconds: 0, secondsRemaining: 0 }))[0].fill, 1);
});

test('quedan redondea hacia arriba y no muestra segundos', () => {
  assert.equal(quedan(1500), '25 min');
  assert.equal(quedan(1441), '25 min');
  assert.equal(quedan(61), '2 min');
  assert.equal(quedan(59), 'menos de un minuto');
  assert.equal(quedan(0), 'menos de un minuto');
});

test('hora estimada de término suma lo que queda de la fase y los segmentos siguientes', () => {
  const s = base({ activeBlocks: [{ index: 1 }, { index: 2 }], secondsRemaining: 600 });
  // quedan 10 min del módulo 1 + descanso 5 + módulo 2 de 25
  assert.equal(estimatedEndMs(s, 0), (600 + 300 + 1500) * 1000);
  assert.equal(plannedStudyMinutes(s), 50);
});

test('formatos de duración y reloj', () => {
  assert.equal(formatDuration(105), '1 h 45 min');
  assert.equal(formatDuration(60), '1 h');
  assert.equal(formatDuration(25), '25 min');
  assert.match(formatClock(new Date(2026, 9, 13, 7, 5).getTime()), /^07:05$/);
});

test('detecta el paso de descanso a enfoque', () => {
  assert.equal(cameFromBreak('SHORT_BREAK', 'FOCUS'), true);
  assert.equal(cameFromBreak('LONG_BREAK', 'FOCUS'), true);
  assert.equal(cameFromBreak('FOCUS', 'FOCUS'), false);
  assert.equal(cameFromBreak(null, 'FOCUS'), false);
  assert.equal(cameFromBreak('FOCUS', 'SHORT_BREAK'), false);
});

test('sin descansos no hay segmentos de descanso y el segmento actual se encuentra igual', () => {
  const s = base({ activeConfig: { workMinutes: 25, shortBreakMinutes: 0, longBreakMinutes: 15, longBreakEvery: 0 }, currentBlockIndex: 3 });
  assert.deepEqual(buildSegments(s).map((x) => x.kind), ['block', 'block', 'block', 'block', 'block']);
  assert.equal(currentSegmentIndex(s), 2);
});

test('descanso largo cada 2 bloques y el segmento de descanso actual', () => {
  const s = base({ activeConfig: { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 2 }, currentBlockIndex: 2, currentPhase: 'SHORT_BREAK' });
  const segs = buildSegments(s);
  assert.deepEqual(segs.filter((x) => x.kind === 'break').map((x) => x.minutes), [5, 15, 5, 15]);
  assert.equal(currentSegmentIndex(s), 3);
});
