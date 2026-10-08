import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { methods, isAvailable, prototypeHref } from './methods.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const noscript = html.match(/<noscript>[\s\S]*?<\/noscript>/)?.[0] ?? '';

test('prototypeHref respeta la base con o sin barra final', () => {
  assert.equal(prototypeHref('/kairosmethod/', 'montessori'), '/kairosmethod/prototypes/montessori/');
  assert.equal(prototypeHref('/kairosmethod', 'montessori'), '/kairosmethod/prototypes/montessori/');
  assert.equal(prototypeHref('/', 'montessori'), '/prototypes/montessori/');
});

test('los ids son únicos y válidos para una URL', () => {
  const ids = methods.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9][a-z0-9-]*$/);
});

test('cada método tiene nombre, resumen y un estado conocido', () => {
  for (const m of methods) {
    assert.ok(m.name && m.summary, `${m.id} sin nombre o resumen`);
    assert.ok(['available', 'soon'].includes(m.status), `${m.id} con estado desconocido`);
  }
});

test('hoy solo Montessori está habilitado', () => {
  assert.deepEqual(methods.filter(isAvailable).map((m) => m.id), ['montessori']);
});

test('cada método habilitado tiene su prototipo en apps/prototypes', () => {
  for (const m of methods.filter(isAvailable)) {
    const pkg = new URL(`../../../apps/prototypes/${m.id}/package.json`, import.meta.url);
    assert.ok(existsSync(pkg), `falta apps/prototypes/${m.id}/package.json`);
  }
});

test('el respaldo <noscript> enlaza solo a los métodos habilitados', () => {
  assert.ok(noscript, 'falta el bloque <noscript> en index.html');
  for (const m of methods) {
    const link = `href="%BASE_URL%prototypes/${m.id}/"`;
    assert.equal(noscript.includes(link), isAvailable(m), `${m.id}: el <noscript> no coincide con su estado`);
  }
});
