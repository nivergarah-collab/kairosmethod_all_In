import test from 'node:test';
import assert from 'node:assert/strict';
import { sanear, ajustar, elegirPerfil, rangoDe, TODOS_LOS_AJUSTES, GRUPOS } from './ajustes.js';
import { PERFILES, ORDEN_PERFILES, PERFIL_INICIAL, perfilDe } from './perfiles.js';

test('sanear(null) da el perfil inicial completo', () => {
  const c = sanear(null);
  assert.equal(c.perfil, PERFIL_INICIAL);
  for (const a of TODOS_LOS_AJUSTES) assert.notEqual(c[a.clave], undefined, a.clave);
  assert.deepEqual(sanear(undefined), c);
  assert.deepEqual(sanear([1, 2]), c);
});

test('cada perfil existe, tiene resumen y valores dentro de sus rangos', () => {
  assert.deepEqual(ORDEN_PERFILES, ['libre', 'guiado', 'estructurado']);
  for (const id of ORDEN_PERFILES) {
    const p = PERFILES[id];
    assert.ok(p.nombre && p.resumen);
    const [min, max] = p.rangos.extension;
    assert.ok(p.valores.extension >= min && p.valores.extension <= max);
    assert.deepEqual(sanear(elegirPerfil(id)), elegirPerfil(id));
  }
  assert.equal(perfilDe('nada').id, PERFIL_INICIAL);
});

test('los perfiles se diferencian en avisos, avance y secuencia', () => {
  assert.equal(PERFILES.libre.valores.avance, 'auto');
  assert.equal(PERFILES.guiado.valores.avance, 'enfoque');
  assert.equal(PERFILES.estructurado.valores.avance, 'todas');
  assert.equal(PERFILES.libre.valores.avisoSeg, 0);
  assert.equal(PERFILES.guiado.valores.secuencia, true);
  assert.equal(PERFILES.estructurado.valores.tamano, 'grande');
});

test('sanear descarta valores fuera de rango o de tipo y mantiene los válidos', () => {
  const c = sanear({ perfil: 'guiado', extension: 99, avisoSeg: 45, avance: 'siempre', cifras: 'sí', secuencia: false, tamano: 'enorme', movimiento: 'reducir' });
  assert.equal(c.extension, PERFILES.guiado.valores.extension);
  assert.equal(c.avisoSeg, 60);
  assert.equal(c.avance, 'enfoque');
  assert.equal(c.cifras, true);
  assert.equal(c.secuencia, false);
  assert.equal(c.tamano, 'enorme');
  assert.equal(c.movimiento, 'reducir');
  assert.equal(sanear({ perfil: '__proto__' }).perfil, PERFIL_INICIAL);
  assert.equal(sanear({ extension: 2.5 }).extension, PERFILES.libre.valores.extension);
});

test('ajustar cambia un valor y respeta el rango del perfil', () => {
  const c = elegirPerfil('estructurado');
  assert.equal(ajustar(c, 'extension', 3).extension, 3);
  assert.equal(ajustar(c, 'extension', 6).extension, PERFILES.estructurado.valores.extension);
  assert.deepEqual(rangoDe(c, 'extension'), [1, 5]);
});

test('cada ajuste tiene su línea de ayuda y los tiempos no están entre los ajustes', () => {
  for (const a of TODOS_LOS_AJUSTES) assert.ok(a.ayuda && a.ayuda.length > 10, a.clave);
  const claves = TODOS_LOS_AJUSTES.map((a) => a.clave);
  for (const t of ['enfoque', 'corto', 'largo', 'bloques', 'sonido', 'vibracion']) assert.equal(claves.includes(t), false, t);
  assert.deepEqual(GRUPOS.map((g) => g.id), ['avisos', 'pantalla']);
});
