import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLES, exampleWorkspace } from './examples.js';
import { reducer, initialState, ITEM_TYPES, VIEWS, SIZES } from './state.js';
import { sanitizeSaved, toSaved } from './storage.js';

test('hay entre 4 y 6 ejemplos con nombre, descripción e id único', () => {
  assert.ok(EXAMPLES.length >= 4 && EXAMPLES.length <= 6);
  assert.equal(new Set(EXAMPLES.map((e) => e.id)).size, EXAMPLES.length);
  for (const e of EXAMPLES) {
    assert.ok(e.name && e.description, e.id);
    assert.ok(e.items.length >= 2, e.id);
  }
});

test('cada ejemplo supera el saneamiento sin cambios', () => {
  for (const ex of EXAMPLES) {
    const raw = ex.items.map(([type, x, y, view, size, config], i) => ({ id: i + 1, type, x, y, view, size, config }));
    const w = exampleWorkspace(ex.id, 1).workspace;
    assert.equal(w.items.length, raw.length, `${ex.id}: no descarta elementos`);
    w.items.forEach((it, i) => {
      assert.equal(it.x, raw[i].x, `${ex.id} x`);
      assert.equal(it.y, raw[i].y, `${ex.id} y`);
      assert.equal(it.view, raw[i].view);
      assert.equal(it.size, raw[i].size);
      assert.deepEqual(it.config, { ...it.config, ...raw[i].config }, `${ex.id} config intacta`);
      assert.ok(ITEM_TYPES[it.type] && VIEWS.includes(it.view) && SIZES.includes(it.size));
    });
    assert.equal(w.background, ex.background);
    assert.equal(w.template, ex.template);
  }
});

test('ningún ejemplo deja elementos fuera del escritorio y los ids son únicos', () => {
  for (const ex of EXAMPLES) {
    const { items } = exampleWorkspace(ex.id, 7).workspace;
    assert.equal(new Set(items.map((i) => i.id)).size, items.length);
    for (const i of items) assert.ok(i.x >= 4 && i.x <= 96 && i.y >= 6 && i.y <= 94, `${ex.id} #${i.id}`);
  }
});

test('un ejemplo inexistente da null; aplicar uno guarda un estado válido', () => {
  assert.equal(exampleWorkspace('nada'), null);
  const s = reducer(initialState, { type: 'applyExample', payload: exampleWorkspace('noche-repaso', 1) });
  assert.equal(s.background, 'dark');
  assert.ok(s.goals.length > 0 && s.tasks.length > 0);
  assert.ok(sanitizeSaved(JSON.parse(JSON.stringify(toSaved(s)))));
});

test('aplicar un ejemplo respeta tareas y metas que la persona ya tenía', () => {
  let s = reducer(initialState, { type: 'listAdd', list: 'tasks', text: 'Mi tarea' });
  s = reducer(s, { type: 'applyExample', payload: exampleWorkspace('tarea-larga', s.nextId) });
  assert.deepEqual(s.tasks.map((t) => t.text), ['Mi tarea']);
  assert.ok(s.goals.length > 0);
  const ids = [...s.tasks, ...s.goals].map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('los textos de los ejemplos caben en la interfaz y en los topes del guardado', () => {
  for (const ex of EXAMPLES) {
    assert.ok(ex.name.length <= 30, `${ex.id} nombre`);
    assert.ok(ex.description.length <= 90, `${ex.id} descripción`);
    assert.ok(ex.goals.length <= 3 && ex.tasks.length <= 5, `${ex.id} listas`);
    for (const t of [...ex.goals, ...ex.tasks]) assert.ok(t.length > 0 && t.length <= 120, `${ex.id} lista`);
  }
});

test('cargar el mismo ejemplo dos veces no duplica tareas ni metas', () => {
  let s = reducer(initialState, { type: 'applyExample', payload: exampleWorkspace('noche-repaso', 1) });
  const n = s.tasks.length + s.goals.length;
  s = reducer(s, { type: 'applyExample', payload: exampleWorkspace('noche-repaso', s.nextId) });
  assert.equal(s.tasks.length + s.goals.length, n);
});

test('el espacio de cada ejemplo se exporta e importa sin perder nada', async () => {
  const { workspaceExport, parseWorkspaceImport } = await import('./storage.js');
  for (const ex of EXAMPLES) {
    const s = reducer(initialState, { type: 'applyExample', payload: exampleWorkspace(ex.id, 1) });
    const res = parseWorkspaceImport(JSON.stringify(workspaceExport(s)));
    assert.ok(res.ok, ex.id);
    assert.equal(res.dropped, 0, ex.id);
    assert.deepEqual(res.workspace.items, s.items, ex.id);
  }
});
