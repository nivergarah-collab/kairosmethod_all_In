import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reducer, initialState, sanitizeConfig, getProgress, shortLine, formatClock, clampX, clampY, ITEM_TYPES,
} from './state.js';

const add = (s, itemType, x, y) => reducer(s, { type: 'add', itemType, x, y });

test('add crea un elemento con ids únicos y defaults', () => {
  let s = add(initialState, 'lamp', 10, 20);
  s = add(s, 'lamp', 30, 40);
  assert.equal(s.items.length, 2);
  assert.notEqual(s.items[0].id, s.items[1].id);
  assert.deepEqual(s.items[0].config, { on: false });
  assert.equal(s.items[0].view, 'icon');
  assert.equal(s.items[0].size, 'main');
  assert.equal(s.items[0].done, false);
});

test('add ignora tipos desconocidos', () => {
  assert.equal(add(initialState, 'bomba', 1, 1), initialState);
});

test('la posición se limita al área visible', () => {
  const s = add(initialState, 'water', -50, 900);
  assert.equal(s.items[0].x, 4);
  assert.equal(s.items[0].y, 94);
  assert.equal(clampX('abc'), 50);
  assert.equal(clampY(Infinity), 50);
});

test('toggle marca y desmarca', () => {
  let s = add(initialState, 'water', 50, 50);
  const id = s.items[0].id;
  s = reducer(s, { type: 'toggle', id });
  assert.equal(s.items[0].done, true);
  s = reducer(s, { type: 'toggle', id });
  assert.equal(s.items[0].done, false);
});

test('remove elimina solo el elemento indicado', () => {
  let s = add(add(initialState, 'water', 1, 1), 'lamp', 2, 2);
  s = reducer(s, { type: 'remove', id: s.items[0].id });
  assert.equal(s.items.length, 1);
  assert.equal(s.items[0].type, 'lamp');
});

test('config valida y recorta valores', () => {
  assert.deepEqual(sanitizeConfig('timer', { minutes: 999 }), { minutes: 120 });
  assert.deepEqual(sanitizeConfig('timer', { minutes: 0 }), { minutes: 1 });
  assert.deepEqual(sanitizeConfig('timer', { minutes: 'x' }), { minutes: 25 });
  assert.equal(sanitizeConfig('file', { kind: 'Virus' }).kind, 'PDF');
  assert.equal(sanitizeConfig('notes', { text: 'a'.repeat(900) }).text.length, 500);
  assert.equal(sanitizeConfig('lamp', { on: 'si' }).on, false);
  assert.deepEqual(sanitizeConfig('inexistente', {}), {});
});

test('config actualiza solo el elemento indicado', () => {
  let s = add(add(initialState, 'device', 1, 1), 'device', 2, 2);
  s = reducer(s, { type: 'config', id: s.items[0].id, patch: { device: 'Tablet', role: 'Silencio' } });
  assert.equal(s.items[0].config.device, 'Tablet');
  assert.equal(s.items[1].config.device, 'PC');
});

test('move cambia la posición', () => {
  let s = add(initialState, 'notes', 10, 10);
  s = reducer(s, { type: 'move', id: s.items[0].id, x: 70, y: 40 });
  assert.deepEqual([s.items[0].x, s.items[0].y], [70, 40]);
});

test('progreso: vacío, parcial y completo', () => {
  assert.deepEqual(getProgress([]), { done: 0, total: 0, percent: 0, ready: false });
  let s = reducer(initialState, { type: 'load' });
  s = reducer(s, { type: 'toggle', id: s.items[0].id });
  const p = getProgress(s.items);
  assert.equal(p.done, 1);
  assert.equal(p.ready, false);
  for (const i of s.items) if (!i.done) s = reducer(s, { type: 'toggle', id: i.id });
  const all = getProgress(s.items);
  assert.equal(all.percent, 100);
  assert.equal(all.ready, true);
});

test('load carga el ejemplo con ids nuevos y clear lo vacía', () => {
  const s = reducer(initialState, { type: 'load' });
  assert.equal(s.items.length, Object.keys(ITEM_TYPES).length);
  assert.equal(new Set(s.items.map((i) => i.id)).size, s.items.length);
  assert.equal(reducer(s, { type: 'clear' }).items.length, 0);
});

test('shortLine describe cada tipo', () => {
  const s = reducer(initialState, { type: 'load' });
  for (const item of s.items) assert.ok(shortLine(item).length > 0, item.type);
});

test('shortLine del temporizador usa el tiempo vivo', () => {
  const s = reducer(initialState, { type: 'load' });
  const t = s.items.find((i) => i.type === 'timer');
  assert.equal(shortLine(t), '25:00');
  assert.equal(shortLine(t, { left: 61, running: true }), '01:01 · en marcha');
});

test('formatClock da mm:ss y h:mm:ss, y tolera valores raros', () => {
  assert.equal(formatClock(75), '01:15');
  assert.equal(formatClock(3725), '1:02:05');
  assert.equal(formatClock(-4), '00:00');
  assert.equal(formatClock(NaN), '00:00');
  assert.equal(formatClock(59.9), '00:59');
});

test('las vistas rotan icono → con nombre → en uso → icono y se pueden fijar', () => {
  let s = add(initialState, 'lamp', 50, 50);
  const id = s.items[0].id;
  const seen = [];
  for (let k = 0; k < 4; k++) {
    s = reducer(s, { type: 'cycleView', id });
    seen.push(s.items[0].view);
  }
  assert.deepEqual(seen, ['named', 'live', 'icon', 'named']);
  s = reducer(s, { type: 'setView', id, view: 'live' });
  assert.equal(s.items[0].view, 'live');
  s = reducer(s, { type: 'setView', id, view: 'basura' });
  assert.equal(s.items[0].view, 'live');
});

test('el tamaño es independiente de la vista', () => {
  let s = add(initialState, 'notes', 50, 50);
  const id = s.items[0].id;
  s = reducer(s, { type: 'setView', id, view: 'live' });
  s = reducer(s, { type: 'toggleSize', id });
  assert.deepEqual([s.items[0].size, s.items[0].view], ['side', 'live']);
  s = reducer(s, { type: 'toggleSize', id });
  assert.equal(s.items[0].size, 'main');
});

test('fondo y aspecto aceptan solo valores conocidos', () => {
  let s = reducer(initialState, { type: 'setBackground', background: 'dark' });
  assert.equal(s.background, 'dark');
  s = reducer(s, { type: 'setBackground', background: 'espacio' });
  assert.equal(s.background, 'dark');
  s = reducer(s, { type: 'setTemplate', template: 'table' });
  assert.equal(s.template, 'table');
  s = reducer(s, { type: 'setTemplate', template: 'x' });
  assert.equal(s.template, 'table');
});

test('el temporizador es el nuevo nombre del cronómetro del escritorio', () => {
  assert.equal(ITEM_TYPES.timer.label, 'Temporizador');
});

test('música guarda la playlist escrita y la recorta', () => {
  assert.equal(sanitizeConfig('music', { playlist: 'x'.repeat(200) }).playlist.length, 60);
});

test('acción desconocida no cambia el estado', () => {
  assert.equal(reducer(initialState, { type: 'zzz' }), initialState);
});

// ---------- Sesión y herramientas ----------
import { buildSummary, duePauses, LIST_TEXT_MAX, LIST_MAX_ITEMS } from './state.js';

test('startSession pasa a sesión y endSession vuelve a preparación limpiando tareas y metas', () => {
  let s = reducer(initialState, { type: 'load' });
  s = reducer(s, { type: 'listAdd', list: 'tasks', text: 'Leer capítulo 3' });
  s = reducer(s, { type: 'listAdd', list: 'goals', text: 'Terminar guía' });
  s = reducer(s, { type: 'listAdd', list: 'distractions', text: 'Revisar correo' });
  s = reducer(s, { type: 'startSession' });
  assert.equal(s.phase, 'session');
  s = reducer(s, { type: 'endSession' });
  assert.equal(s.phase, 'prep');
  assert.equal(s.tasks.length, 0);
  assert.equal(s.goals.length, 0);
  assert.equal(s.items.length, 7, 'el escritorio queda guardado');
  assert.equal(s.distractions.length, 1, 'las distracciones no se limpian (lectura literal de la spec)');
});

test('listAdd recorta, ignora vacíos y listas inválidas, y respeta el máximo', () => {
  let s = reducer(initialState, { type: 'listAdd', list: 'tasks', text: '   ' });
  assert.equal(s.tasks.length, 0);
  s = reducer(s, { type: 'listAdd', list: 'tasks', text: '  hola  ' });
  assert.equal(s.tasks[0].text, 'hola');
  s = reducer(s, { type: 'listAdd', list: 'tasks', text: 'x'.repeat(500) });
  assert.equal(s.tasks[1].text.length, LIST_TEXT_MAX);
  assert.equal(reducer(s, { type: 'listAdd', list: 'otra', text: 'a' }), s);
  assert.equal(reducer(s, { type: 'listAdd', list: 'tasks', text: 42 }), s);
  for (let k = 0; k < LIST_MAX_ITEMS + 5; k++) s = reducer(s, { type: 'listAdd', list: 'tasks', text: `t${k}` });
  assert.equal(s.tasks.length, LIST_MAX_ITEMS);
  assert.equal(new Set(s.tasks.map((t) => t.id)).size, s.tasks.length);
});

test('listToggle y listRemove actúan solo sobre su entrada y su lista', () => {
  let s = reducer(initialState, { type: 'listAdd', list: 'tasks', text: 'a' });
  s = reducer(s, { type: 'listAdd', list: 'goals', text: 'b' });
  const tid = s.tasks[0].id;
  s = reducer(s, { type: 'listToggle', list: 'tasks', id: tid });
  assert.equal(s.tasks[0].done, true);
  assert.equal(s.goals[0].done, false);
  assert.equal(reducer(s, { type: 'listToggle', list: 'x', id: tid }), s);
  s = reducer(s, { type: 'listRemove', list: 'tasks', id: tid });
  assert.equal(s.tasks.length, 0);
  assert.equal(s.goals.length, 1);
});

test('pausas: vencen según el tiempo y se confirman con pauseAck', () => {
  let s = reducer(initialState, { type: 'pauseEvery', id: 'water', every: 15, elapsed: 0 });
  assert.deepEqual(duePauses(s.pauses, 14 * 60), []);
  assert.deepEqual(duePauses(s.pauses, 15 * 60), ['water']);
  s = reducer(s, { type: 'pauseAck', id: 'water', elapsed: 15 * 60 + 5 });
  assert.deepEqual(duePauses(s.pauses, 20 * 60), []);
  assert.deepEqual(duePauses(s.pauses, 30 * 60), ['water']);
  // opciones inválidas y apagado
  assert.equal(reducer(s, { type: 'pauseEvery', id: 'water', every: 7, elapsed: 0 }), s);
  assert.equal(reducer(s, { type: 'pauseEvery', id: 'nada', every: 15, elapsed: 0 }), s);
  s = reducer(s, { type: 'pauseEvery', id: 'water', every: 0, elapsed: 0 });
  assert.deepEqual(duePauses(s.pauses, 99999), []);
});

test('al activar una pausa a mitad de sesión no vence de inmediato', () => {
  const s = reducer(initialState, { type: 'pauseEvery', id: 'rest', every: 30, elapsed: 95 * 60 });
  assert.deepEqual(duePauses(s.pauses, 95 * 60), []);
  assert.deepEqual(duePauses(s.pauses, 120 * 60), ['rest']);
});

test('buildSummary junta duración, tareas, metas, notas y distracciones', () => {
  let s = reducer(initialState, { type: 'load' });
  s = reducer(s, { type: 'listAdd', list: 'tasks', text: 'A' });
  s = reducer(s, { type: 'listAdd', list: 'tasks', text: 'B' });
  s = reducer(s, { type: 'listToggle', list: 'tasks', id: s.tasks[0].id });
  s = reducer(s, { type: 'listAdd', list: 'goals', text: 'Meta' });
  s = reducer(s, { type: 'listAdd', list: 'distractions', text: 'Idea suelta' });
  const sum = buildSummary(s, 3725.8, new Date('2026-10-08T12:00:00Z'));
  assert.equal(sum.durationSeconds, 3725);
  assert.deepEqual([sum.tasks.done, sum.tasks.total], [1, 2]);
  assert.deepEqual([sum.goals.done, sum.goals.total], [0, 1]);
  assert.deepEqual(sum.notes, [{ title: 'Dudas', text: 'Repasar derivadas' }]);
  assert.deepEqual(sum.distractions, ['Idea suelta']);
  assert.equal(sum.finishedAt, '2026-10-08T12:00:00.000Z');
  assert.equal(buildSummary(initialState, -5).durationSeconds, 0);
});

test('terminar la sesión conserva el espacio (lámpara, vaso, notas) y las distracciones', () => {
  let s = reducer(initialState, { type: 'load' });
  const lamp = s.items.find((i) => i.type === 'lamp');
  s = reducer(s, { type: 'config', id: lamp.id, patch: { on: false } });
  s = reducer(s, { type: 'listAdd', list: 'distractions', text: 'Revisar el correo' });
  s = reducer(s, { type: 'startSession' });
  s = reducer(s, { type: 'endSession' });
  assert.equal(s.items.length, 7);
  assert.equal(s.items.find((i) => i.id === lamp.id).config.on, false);
  assert.equal(s.distractions.length, 1);
  assert.equal(s.phase, 'prep');
});

test('pauseEvery solo acepta intervalos conocidos y pauseAck ignora pausas apagadas', () => {
  let s = reducer(initialState, { type: 'startSession' });
  const id = Object.keys(s.pauses)[0];
  const before = s.pauses[id];
  assert.equal(reducer(s, { type: 'pauseEvery', id, every: 7, elapsed: 0 }).pauses[id], before);
  assert.equal(reducer(s, { type: 'pauseEvery', id: 'inexistente', every: 15, elapsed: 0 }), s);
  s = reducer(s, { type: 'pauseEvery', id, every: 0, elapsed: 0 });
  assert.equal(reducer(s, { type: 'pauseAck', id, elapsed: 9999 }), s);
});

test('importWorkspace nunca baja el contador de ids ni toca las listas', () => {
  let s = reducer(initialState, { type: 'load' });
  s = reducer(s, { type: 'listAdd', list: 'goals', text: 'Meta' });
  const next = s.nextId;
  const out = reducer(s, { type: 'importWorkspace', workspace: { items: [], nextId: 1, background: 'dark', template: 'table' } });
  assert.ok(out.nextId >= next);
  assert.equal(out.goals.length, 1);
  assert.equal(out.background, 'dark');
  assert.equal(reducer(s, { type: 'importWorkspace' }), s);
});

test('cargar el ejemplo dos veces no repite ids ni deja elementos fuera del escritorio', () => {
  let s = reducer(initialState, { type: 'load' });
  s = reducer(s, { type: 'load' });
  const ids = s.items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const i of s.items) {
    assert.ok(i.x >= 0 && i.x <= 100 && i.y >= 0 && i.y <= 100);
  }
});
