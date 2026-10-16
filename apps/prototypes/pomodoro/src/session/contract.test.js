import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ActionType as A,
  CONTRACT_VERSION,
  EventKind,
  Phase,
  breakAfter,
  planTotals,
  createSession,
  extractSession,
  fromSavedRecord,
  normalizeConfig,
  reduceSession,
  toSavedRecord,
} from './contract.js';

const cfg = { topic: 'Álgebra', subtopic: 'Matrices', blocksCount: 2, workMinutes: 10, shortBreakMinutes: 2, longBreakMinutes: 6 };
const act = (s, type, extra = {}, now = 5000) => reduceSession(s, { type, ...extra }, now);
const ticks = (s, n) => { let cur = s; for (let i = 0; i < n; i++) cur = act(cur, A.TICK).session; return cur; };

test('normalizeConfig aplica valores por defecto y descarta números inválidos', () => {
  const c = normalizeConfig({ topic: '  ', subtopic: '', blocksCount: 0, workMinutes: 'x', shortBreakMinutes: -3 });
  assert.equal(c.topic, 'Tema General');
  assert.equal(c.subtopic, 'Sesión de Enfoque');
  assert.equal(c.blocksCount, 4);
  assert.equal(c.workMinutes, 25);
  assert.equal(c.shortBreakMinutes, 5);
  assert.equal(c.longBreakMinutes, 15);
});

test('createSession arma bloques con metas propias o por defecto', () => {
  const s = createSession({ ...cfg, blockGoals: { 2: 'Resolver guía' } }, 1000);
  assert.equal(s.version, CONTRACT_VERSION);
  assert.equal(s.blocks.length, 2);
  assert.equal(s.blocks[0].goal, 'Álgebra: Matrices');
  assert.equal(s.blocks[1].goal, 'Resolver guía');
  assert.equal(s.secondsRemaining, 600);
  assert.equal(s.running, true);
  assert.equal(s.startTime, 1000);
});

test('reduceSession no muta la sesión recibida', () => {
  const s = createSession(cfg, 0);
  const frozen = JSON.stringify(s);
  act(s, A.TICK);
  act(s, A.TOGGLE_BLOCK, { index: 1 });
  act(s, A.ADD_MINUTES, { minutes: 5 });
  assert.equal(JSON.stringify(s), frozen);
});

test('tick resta un segundo y acumula enfoque; con 0 s cierra la fase', () => {
  let s = ticks(createSession(cfg, 0), 600);
  assert.equal(s.secondsRemaining, 0);
  assert.equal(s.focusSeconds, 600);
  assert.equal(s.phase, Phase.FOCUS);
  const r = act(s, A.TICK, {}, 9000);
  assert.equal(r.session.phase, Phase.SHORT_BREAK);
  assert.equal(r.session.secondsRemaining, 120);
  assert.equal(r.session.blocks[0].isCompleted, true);
  assert.equal(r.session.blocks[0].completedAt, 9000);
  assert.deepEqual(r.events, [{ kind: EventKind.ALERT, type: 'BLOCK_ENDS' }]);
  s = ticks(r.session, 3);
  assert.equal(s.breakSeconds, 3);
  assert.equal(s.focusSeconds, 600);
});

test('del descanso se vuelve al enfoque del bloque siguiente y al final se termina', () => {
  let s = createSession(cfg, 0);
  s = act(s, A.SKIP_PHASE).session; // fin del bloque 1 -> descanso corto
  assert.equal(s.phase, Phase.SHORT_BREAK);
  const back = act(s, A.SKIP_PHASE);
  assert.equal(back.session.phase, Phase.FOCUS);
  assert.equal(back.session.blockIndex, 2);
  assert.deepEqual(back.events, [{ kind: EventKind.ALERT, type: 'BLOCK_BEGINS' }]);
  const end = act(back.session, A.SKIP_PHASE);
  assert.equal(end.session.finished, true);
  assert.equal(end.session.running, false);
  assert.deepEqual(end.events, [{ kind: EventKind.ALERT, type: 'SESSION_COMPLETE' }]);
});

test('descanso largo cuando el índice es múltiplo de 4 y no es el último', () => {
  let s = createSession({ ...cfg, blocksCount: 5 }, 0);
  for (let b = 1; b <= 3; b++) { s = act(s, A.SKIP_PHASE).session; s = act(s, A.SKIP_PHASE).session; }
  s = act(s, A.SKIP_PHASE).session;
  assert.equal(s.phase, Phase.LONG_BREAK);
  assert.equal(s.secondsRemaining, 360);
});

test('si el último descanso termina, la sesión se cierra', () => {
  let s = createSession({ ...cfg, blocksCount: 1 }, 0);
  s = act(s, A.SKIP_PHASE).session;
  assert.equal(s.finished, true);
  assert.equal(s.blocks[0].isCompleted, true);
});

test('pausa, reanudación y alternar; los ticks en pausa no hacen nada', () => {
  let s = createSession(cfg, 0);
  s = act(s, A.TOGGLE_PLAY).session;
  assert.equal(s.running, false);
  assert.equal(ticks(s, 5).secondsRemaining, 600);
  s = act(s, A.RESUME).session;
  assert.equal(s.running, true);
  s = act(s, A.PAUSE).session;
  assert.equal(s.running, false);
  assert.equal(act(s, A.PAUSE).session, s);
});

test('addMinutes suma o resta sin dejar valores negativos', () => {
  let s = createSession(cfg, 0);
  s = act(s, A.ADD_MINUTES, { minutes: 5 }).session;
  assert.equal(s.secondsRemaining, 900);
  assert.equal(s.phaseTotalSeconds, 900);
  s = act(s, A.ADD_MINUTES, { minutes: -100 }).session;
  assert.equal(s.secondsRemaining, 0);
  assert.equal(s.phaseTotalSeconds, 1);
  assert.equal(act(s, A.ADD_MINUTES, { minutes: 'x' }).session, s);
});

test('marcar bloques emite un evento háptico y alterna la marca', () => {
  let s = createSession(cfg, 0);
  let r = act(s, A.TOGGLE_BLOCK, { index: 2 }, 777);
  assert.equal(r.session.blocks[1].isCompleted, true);
  assert.equal(r.session.blocks[1].completedAt, 777);
  assert.deepEqual(r.events, [{ kind: EventKind.HAPTIC }]);
  r = act(r.session, A.TOGGLE_BLOCK, { index: 2 });
  assert.equal(r.session.blocks[1].isCompleted, false);
  assert.equal(r.session.blocks[1].completedAt, null);
  assert.equal(act(s, A.TOGGLE_BLOCK, { index: 99 }).session, s);
  assert.equal(act(s, A.COMPLETE_CURRENT).session.blocks[0].isCompleted, true);
});

test('finish termina la sesión; una sesión terminada solo permite marcar bloques', () => {
  let s = act(createSession(cfg, 0), A.FINISH).session;
  assert.equal(s.finished, true);
  assert.equal(act(s, A.RESUME).session, s);
  assert.equal(act(s, A.TOGGLE_PLAY).session, s);
  assert.equal(act(s, A.SKIP_PHASE).session, s);
  assert.equal(act(s, A.ADD_MINUTES, { minutes: 5 }).session, s);
  assert.equal(act(s, A.TICK).session, s);
  assert.equal(act(s, A.TOGGLE_BLOCK, { index: 1 }).session.blocks[0].isCompleted, true);
});

test('acciones desconocidas o sesión nula se ignoran', () => {
  const s = createSession(cfg, 0);
  assert.equal(act(s, 'otra').session, s);
  assert.deepEqual(reduceSession(null, { type: A.TICK }), { session: null, events: [] });
  assert.equal(reduceSession(s, null).session, s);
});

test('extractSession entrega el resumen con tasa de cumplimiento', () => {
  let s = createSession(cfg, 0);
  s = act(s, A.TOGGLE_BLOCK, { index: 1 }).session;
  const e = extractSession(ticks(s, 7));
  assert.equal(e.topic, 'Álgebra');
  assert.equal(e.totalBlocksPlanned, 2);
  assert.equal(e.blocksCompleted, 1);
  assert.equal(e.completionRate, 0.5);
  assert.equal(e.focusSeconds, 7);
  assert.equal(e.satisfactionRating, 5);
});

test('extractSession conserva la rareza del APK: subtema vacío = «Sesión de Estudio»', () => {
  assert.equal(extractSession(createSession({ ...cfg, subtopic: '' }, 0)).subtopic, 'Sesión de Estudio');
  assert.equal(extractSession(createSession({ ...cfg, subtopic: 'Sesión de Enfoque' }, 0)).subtopic, 'Sesión de Enfoque');
});

test('el registro guardado no incluye la visión usada', () => {
  const s = { ...createSession(cfg, 1000), vision: 'calma' };
  const { session, blocks } = toSavedRecord(s, { userId: 3, notes: 'ok', rating: 4, endTime: 9000 });
  const dump = JSON.stringify({ session, blocks }).toLowerCase();
  assert.equal(dump.includes('vision'), false);
  assert.equal(dump.includes('visión'), false);
  assert.equal(session.userId, 3);
  assert.equal(session.satisfactionRating, 4);
  assert.equal(session.endTime, 9000);
  assert.equal(session.isCompleted, false);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].sessionId, 0);
});

test('guardar y reabrir devuelve una sesión de solo lectura equivalente', () => {
  let s = createSession(cfg, 1000);
  s = act(s, A.TOGGLE_BLOCK, { index: 1 }).session;
  s = ticks(s, 12);
  const { session, blocks } = toSavedRecord(s, { userId: 1, endTime: 2000 });
  const view = fromSavedRecord(session, [...blocks].reverse().map((b, i) => ({ ...b, id: i })));
  assert.equal(view.readOnly, true);
  assert.equal(view.finished, true);
  assert.equal(view.running, false);
  assert.deepEqual(view.blocks.map((b) => b.index), [1, 2]);
  assert.equal(view.focusSeconds, 12);
  assert.equal(view.config.topic, 'Álgebra');
  assert.deepEqual(extractSession(view).completionRate, 0.5);
  assert.equal(act(view, A.TICK).session, view);
});

test('restartPhase devuelve la fase actual a su duración total sin cambiar de fase', () => {
  let s = ticks(createSession(cfg, 0), 100);
  s = act(s, A.ADD_MINUTES, { minutes: 5 }).session;
  const r = act(s, A.RESTART_PHASE).session;
  assert.equal(r.secondsRemaining, 900);
  assert.equal(r.phase, Phase.FOCUS);
  assert.equal(r.focusSeconds, 100);
  const done = act(createSession(cfg, 0), A.FINISH).session;
  assert.equal(act(done, A.RESTART_PHASE).session, done);
});

test('una sesión reabierta desde un registro es de solo lectura: ninguna acción la cambia', () => {
  const saved = { topic: 'Álgebra', subtopic: 'Matrices', totalBlocksPlanned: 2, workDurationMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, totalFocusSecondsSpent: 3000, totalBreakSecondsSpent: 300, startTime: 1 };
  const blocks = [{ blockIndex: 1, title: 'Bloque 1', goal: 'a', durationMinutes: 25, isCompleted: true, completedAt: 5 }, { blockIndex: 2, title: 'Bloque 2', goal: 'b', durationMinutes: 25, isCompleted: false, completedAt: null }];
  const s = fromSavedRecord(saved, blocks);
  assert.equal(s.readOnly, true);
  assert.equal(s.config.topic, 'Álgebra');
  for (const type of Object.values(A)) {
    const r = reduceSession(s, { type, index: 2, minutes: 5 }, 10);
    assert.equal(r.session, s, type);
    assert.deepEqual(r.events, [], type);
  }
});

test('normalizeConfig acepta 0 min de descanso y 0 como «nunca descanso largo»', () => {
  const c = normalizeConfig({ shortBreakMinutes: 0, longBreakMinutes: 0, longBreakEvery: 0 });
  assert.equal(c.shortBreakMinutes, 0);
  assert.equal(c.longBreakMinutes, 0);
  assert.equal(c.longBreakEvery, 0);
  assert.equal(normalizeConfig({}).longBreakEvery, 4);
  assert.equal(normalizeConfig({ longBreakEvery: 99 }).longBreakEvery, 12);
});

test('breakAfter: largo cada N bloques, corto en el resto, nada si dura 0', () => {
  const c = normalizeConfig({ shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 3 });
  assert.deepEqual(breakAfter(c, 1), { phase: Phase.SHORT_BREAK, minutes: 5 });
  assert.deepEqual(breakAfter(c, 3), { phase: Phase.LONG_BREAK, minutes: 15 });
  assert.deepEqual(breakAfter(c, 6), { phase: Phase.LONG_BREAK, minutes: 15 });
  assert.equal(breakAfter({ ...c, longBreakEvery: 0 }, 3).phase, Phase.SHORT_BREAK);
  assert.equal(breakAfter({ ...c, shortBreakMinutes: 0 }, 1), null);
  assert.equal(breakAfter({ ...c, shortBreakMinutes: 0 }, 3).phase, Phase.LONG_BREAK);
  assert.equal(breakAfter({ ...c, longBreakMinutes: 0 }, 3).phase, Phase.SHORT_BREAK);
});

test('planTotals separa estudio efectivo y total con descansos', () => {
  const c = normalizeConfig({ blocksCount: 4, workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 2 });
  // descansos tras los bloques 1, 2 y 3: 5 + 15 + 5
  assert.deepEqual(planTotals(c), { studyMinutes: 100, breakMinutes: 25, totalMinutes: 125 });
  assert.equal(planTotals({ ...c, shortBreakMinutes: 0, longBreakEvery: 0 }).totalMinutes, 100);
  assert.equal(planTotals({ ...c, blocksCount: 1 }).totalMinutes, 25);
});

test('sin descansos la sesión pasa directo al siguiente bloque', () => {
  let s = createSession({ ...cfg, blocksCount: 3, shortBreakMinutes: 0, longBreakEvery: 0 }, 0);
  const r = act(s, A.SKIP_PHASE);
  assert.equal(r.session.phase, Phase.FOCUS);
  assert.equal(r.session.blockIndex, 2);
  assert.equal(r.session.secondsRemaining, 600);
  assert.equal(r.session.blocks[0].isCompleted, true);
  assert.ok(r.events.some((e) => e.type === 'BLOCK_BEGINS'));
  let t = act(r.session, A.SKIP_PHASE).session;
  t = act(t, A.SKIP_PHASE).session;
  assert.equal(t.finished, true);
});

test('descanso largo cada 2 bloques se aplica en la sesión', () => {
  let s = createSession({ ...cfg, blocksCount: 4, longBreakEvery: 2 }, 0);
  s = act(s, A.SKIP_PHASE).session;
  assert.equal(s.phase, Phase.SHORT_BREAK);
  s = act(s, A.SKIP_PHASE).session;
  s = act(s, A.SKIP_PHASE).session;
  assert.equal(s.phase, Phase.LONG_BREAK);
  assert.equal(s.secondsRemaining, 360);
});

test('el registro guardado conserva cada cuántos bloques; los antiguos usan 4', () => {
  const s = createSession({ ...cfg, longBreakEvery: 3 }, 0);
  assert.equal(toSavedRecord(s, { userId: 1, endTime: 9 }).session.longBreakEvery, 3);
  const old = { topic: 'a', subtopic: 'b', totalBlocksPlanned: 2, workDurationMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, totalFocusSecondsSpent: 0, totalBreakSecondsSpent: 0, startTime: 1 };
  assert.equal(fromSavedRecord(old, []).config.longBreakEvery, 4);
});
