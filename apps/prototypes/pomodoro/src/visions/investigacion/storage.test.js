import test from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const { cargar, guardar, borrar, CLAVE } = await import('./storage.js');

test('la clave es propia de esta visión', () => {
  assert.match(CLAVE, /^kairos_pomodoro_vision_/);
  assert.match(CLAVE, /investigacion/);
});

test('guardar y cargar ida y vuelta', () => {
  guardar({ perfil: 'guiado', extension: 7 });
  assert.equal(cargar().perfil, 'guiado');
  assert.equal(cargar().extension, 7);
});

test('JSON corrupto o versión distinta → valores por defecto', () => {
  mem.set(CLAVE, '{no es json');
  assert.equal(cargar().perfil, 'libre');
  mem.set(CLAVE, JSON.stringify({ v: 99, cfg: { extension: 9 } }));
  assert.equal(cargar().extension, 5);
});

test('borrar restablece', () => {
  guardar({ perfil: 'estructurado' });
  borrar();
  assert.equal(cargar().perfil, 'libre');
});

test('solo se guardan los ajustes, nunca sesión ni temporizador', () => {
  guardar({ extension: 4, secondsRemaining: 5, estado: 'corriendo' });
  assert.deepEqual(Object.keys(JSON.parse(mem.get(CLAVE))), ['v', 'cfg']);
  assert.equal(JSON.parse(mem.get(CLAVE)).cfg.secondsRemaining, undefined);
});

test('si el almacenamiento lanza errores, no se rompe', () => {
  const guardado = globalThis.localStorage;
  globalThis.localStorage = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); }, removeItem() { throw new Error('bloqueado'); } };
  assert.equal(cargar().perfil, 'libre');
  assert.equal(guardar({ extension: 4 }), false);
  assert.equal(borrar(), false);
  globalThis.localStorage = guardado;
});
