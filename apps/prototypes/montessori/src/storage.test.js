import test from 'node:test';
import assert from 'node:assert/strict';
import { reducer, initialState } from './state.js';
import {
  STORAGE_KEY, SCHEMA_VERSION, toSaved, sanitizeSaved, loadState, saveState, clearSaved, workspaceExport,
} from './storage.js';

const fakeStorage = (seed = {}) => {
  const data = { ...seed };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
};
const broken = {
  getItem() { throw new Error('bloqueado'); },
  setItem() { throw new Error('lleno'); },
  removeItem() { throw new Error('bloqueado'); },
};

const rich = () => {
  let s = reducer(initialState, { type: 'load' });
  s = reducer(s, { type: 'setBackground', background: 'dark' });
  s = reducer(s, { type: 'setTemplate', template: 'table' });
  s = reducer(s, { type: 'listAdd', list: 'tasks', text: 'Tarea' });
  s = reducer(s, { type: 'listAdd', list: 'goals', text: 'Meta' });
  s = reducer(s, { type: 'listAdd', list: 'distractions', text: 'Idea' });
  return s;
};

test('guardar y cargar devuelve lo mismo (espacio, lámpara, vaso, listas)', () => {
  const st = fakeStorage();
  const s = rich();
  assert.equal(saveState(st, s), true);
  const back = loadState(st);
  assert.deepEqual(back.items, s.items);
  assert.equal(back.background, 'dark');
  assert.equal(back.template, 'table');
  assert.deepEqual(back.tasks, s.tasks);
  assert.deepEqual(back.goals, s.goals);
  assert.deepEqual(back.distractions, s.distractions);
  assert.equal(back.items.find((i) => i.type === 'lamp').config.on, true);
  assert.equal(back.items.find((i) => i.type === 'water').config.filled, true);
  assert.equal(back.phase, 'prep');
});

test('lleva número de versión del esquema', () => {
  assert.equal(toSaved(initialState).schema, SCHEMA_VERSION);
});

test('sin datos, JSON corrupto o esquema de otra versión: se ignora (null)', () => {
  assert.equal(loadState(fakeStorage()), null);
  assert.equal(loadState(fakeStorage({ [STORAGE_KEY]: '{no es json' })), null);
  assert.equal(loadState(fakeStorage({ [STORAGE_KEY]: '[]' })), null);
  assert.equal(loadState(fakeStorage({ [STORAGE_KEY]: 'null' })), null);
  const other = { ...toSaved(rich()), schema: 999 };
  assert.equal(loadState(fakeStorage({ [STORAGE_KEY]: JSON.stringify(other) })), null);
  assert.equal(sanitizeSaved({ schema: 1 }), null);
});

test('si el almacenamiento falla, no lanza: devuelve null / false', () => {
  assert.equal(loadState(broken), null);
  assert.equal(saveState(broken, initialState), false);
  assert.equal(clearSaved(broken), false);
});

test('clearSaved borra lo guardado', () => {
  const st = fakeStorage();
  saveState(st, rich());
  assert.equal(clearSaved(st), true);
  assert.equal(loadState(st), null);
});

test('sanea valores peligrosos o fuera de rango en elementos', () => {
  const evil = {
    schema: 1,
    workspace: {
      background: 'espacio', template: '<img onerror=x>', nextId: 'abc',
      items: [
        { id: 1, type: 'lamp', x: 9999, y: -50, done: 'si', view: 'x', size: 'gigante', config: { on: 'true' } },
        { id: 1, type: 'water', x: 10, y: 10 },
        { id: 2, type: 'bomba', x: 10, y: 10 },
        { id: -3, type: 'water', x: 10, y: 10 },
        { id: 4, type: 'notes', x: 'q', y: 50, config: { text: 'a'.repeat(9000), title: 5 } },
        'basura', null, 7,
      ],
    },
    lists: { tasks: [{ id: 1, text: '  ok  ' }, { id: 1, text: 'dup' }, { id: 2, text: '   ' }, { id: 3, text: 9 }], goals: 'x', distractions: null, nextListId: -1 },
  };
  const s = sanitizeSaved(evil);
  assert.deepEqual(s.items.map((i) => i.id), [1, 4]);
  const lamp = s.items[0];
  assert.deepEqual([lamp.x, lamp.y, lamp.done, lamp.view, lamp.size, lamp.config], [96, 6, false, 'icon', 'main', { on: false }]);
  assert.equal(s.items[1].config.text.length, 500);
  assert.equal(s.items[1].config.title, '', 'un título que no es texto se vacía');
  assert.equal(s.background, 'wood');
  assert.equal(s.template, 'screen');
  assert.ok(s.nextId > 4);
  assert.deepEqual(s.tasks, [{ id: 1, text: 'ok', done: false }]);
  assert.deepEqual(s.goals, []);
  assert.ok(s.nextListId > 1);
});

test('los contadores de ids nunca chocan con los existentes', () => {
  const raw = toSaved(rich());
  raw.workspace.nextId = 1;
  raw.lists.nextListId = 1;
  const s = sanitizeSaved(JSON.parse(JSON.stringify(raw)));
  const ids = new Set(s.items.map((i) => i.id));
  assert.ok(!ids.has(s.nextId));
  const lids = [...s.tasks, ...s.goals, ...s.distractions].map((e) => e.id);
  assert.ok(!lids.includes(s.nextListId));
});

test('workspaceExport trae solo el espacio de trabajo', () => {
  const out = workspaceExport(rich(), new Date('2026-10-08T10:00:00Z'));
  assert.equal(out.kind, 'espacio-de-trabajo');
  assert.equal(out.exportedAt, '2026-10-08T10:00:00.000Z');
  assert.equal(out.items.length, 7);
  assert.equal(out.tasks, undefined);
  assert.equal(out.background, 'dark');
});

import { parseWorkspaceImport, IMPORT_MAX_BYTES } from './storage.js';

test('importar: acepta un espacio exportado y lo sanea', () => {
  const text = JSON.stringify(workspaceExport(rich()));
  const res = parseWorkspaceImport(text);
  assert.equal(res.ok, true);
  assert.equal(res.workspace.items.length, 7);
  assert.equal(res.workspace.background, 'dark');
  assert.equal(res.dropped, 0);
});

test('importar: rechaza vacío, no-JSON, otro tipo, otra versión y archivos enormes', () => {
  assert.equal(parseWorkspaceImport('').ok, false);
  assert.equal(parseWorkspaceImport(null).ok, false);
  assert.equal(parseWorkspaceImport('{no json').ok, false);
  assert.equal(parseWorkspaceImport('[]').ok, false);
  assert.equal(parseWorkspaceImport(JSON.stringify({ kind: 'resumen-de-sesion', schema: 1, items: [] })).ok, false);
  assert.equal(parseWorkspaceImport(JSON.stringify({ kind: 'espacio-de-trabajo', schema: 9, items: [] })).ok, false);
  assert.equal(parseWorkspaceImport(JSON.stringify({ kind: 'espacio-de-trabajo', schema: 1 })).ok, false);
  assert.equal(parseWorkspaceImport('x'.repeat(IMPORT_MAX_BYTES + 1)).ok, false);
});

test('importar: descarta elementos inválidos y lo informa', () => {
  const out = workspaceExport(rich());
  out.items.push({ id: 99, type: 'virus' }, 'basura');
  const res = parseWorkspaceImport(JSON.stringify(out));
  assert.equal(res.ok, true);
  assert.equal(res.dropped, 2);
  assert.equal(res.workspace.items.length, 7);
});

test('importWorkspace reemplaza el espacio y conserva las listas', () => {
  let s = reducer(initialState, { type: 'listAdd', list: 'tasks', text: 'a' });
  const res = parseWorkspaceImport(JSON.stringify(workspaceExport(rich())));
  s = reducer(s, { type: 'importWorkspace', workspace: res.workspace });
  assert.equal(s.items.length, 7);
  assert.equal(s.tasks.length, 1);
  assert.equal(s.template, 'table');
  assert.equal(reducer(s, { type: 'importWorkspace' }), s);
});

const wrap = (items, extra = {}) => ({
  schema: SCHEMA_VERSION,
  workspace: { background: 'wood', template: 'screen', nextId: 1, items },
  lists: { tasks: [], goals: [], distractions: [], nextListId: 1, ...extra },
});

test('sanea tipos de dato inesperados en elementos (NaN, cadenas, nulos, objetos)', () => {
  const s = sanitizeSaved(wrap([
    { id: 1, type: 'timer', x: 'a', y: null, view: 5, size: {}, config: { minutes: 'mucho' } },
    { id: 2, type: 'notes', x: Infinity, y: -Infinity, config: { title: 42, text: { a: 1 } } },
    { id: 3, type: 'lamp', x: 50, y: 50, config: null },
  ]));
  assert.equal(s.items.length, 3);
  for (const it of s.items) {
    assert.ok(Number.isFinite(it.x) && it.x >= 0 && it.x <= 100);
    assert.ok(Number.isFinite(it.y) && it.y >= 0 && it.y <= 100);
    assert.ok(['icon', 'named', 'live'].includes(it.view));
    assert.ok(['main', 'side'].includes(it.size));
  }
  assert.equal(s.items[0].config.minutes, 25);
  assert.equal(typeof s.items[1].config.title, 'string');
  assert.equal(s.items[2].config.on, false);
});

test('no se cuela «__proto__» ni claves extra en la configuración', () => {
  const raw = JSON.parse('{"schema":1,"workspace":{"items":[{"id":1,"type":"lamp","x":10,"y":10,"config":{"__proto__":{"polluted":true},"on":true,"extra":"x"}}]},"lists":{}}');
  const s = sanitizeSaved(raw);
  assert.deepEqual(s.items[0].config, { on: true });
  assert.equal({}.polluted, undefined);
});

test('topes: máximo de elementos y de largo de textos en listas', () => {
  const many = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, type: 'water', x: 10, y: 10 }));
  assert.ok(sanitizeSaved(wrap(many)).items.length <= 100);
  const long = [{ id: 1, text: 'x'.repeat(5000), done: true }, { id: 2, text: '   ', done: false }, { id: 3, text: 7 }];
  const s = sanitizeSaved(wrap([], { tasks: long }));
  assert.equal(s.tasks.length, 1);
  assert.ok(s.tasks[0].text.length <= 200);
});

test('ids duplicados o inválidos en las listas se descartan', () => {
  const s = sanitizeSaved(wrap([], { goals: [{ id: 1, text: 'a' }, { id: 1, text: 'b' }, { id: -3, text: 'c' }, { id: 1.5, text: 'd' }] }));
  assert.deepEqual(s.goals.map((g) => g.text), ['a']);
});

test('lo que se guarda no incluye fase de sesión ni pausas', () => {
  const s = reducer(rich(), { type: 'startSession' });
  const saved = toSaved(s);
  assert.equal(JSON.stringify(saved).includes('"phase"'), false);
  assert.equal(JSON.stringify(saved).includes('pauses'), false);
});
