import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PREDETERMINADA, VISIONES_CON_PALETAS, cargarPaletaVision, claveDe, esPaletaDe, guardarPaletaVision, muestraDe, paletasDe, paresDe, problemasDeContraste, varsDePaleta } from './paletasVision.js';
import { CLARO, OSCURO, PARES } from '../investigacion/colores.js';
import { CLARO as PCLARO, OSCURO as POSCURO, PARES as PPARES } from '../pomodoro/colores.js';

const aqui = dirname(fileURLToPath(import.meta.url));
const VISIONES = ['calma', 'vision', 'pomodoro', 'investigacion', 'paridad'];
const storage = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), m }; };

test('cada visión sugiere exactamente dos paletas propias, con ids únicos y las dos variantes', () => {
  for (const v of VISIONES) {
    const ps = paletasDe(v);
    assert.equal(ps.length, 2, v);
    assert.equal(new Set(ps.map((p) => p.id)).size, 2, v);
    for (const p of ps) { assert.ok(p.nombre && p.descripcion, `${v}/${p.id}`); assert.ok(p.claro && p.oscuro, `${v}/${p.id}`); }
  }
  assert.equal(paletasDe('inexistente').length, 0);
});

test('las paletas no se comparten: ningún id se repite entre visiones y las variables llevan el prefijo de su visión', () => {
  const ids = VISIONES.flatMap((v) => paletasDe(v).map((p) => p.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const v of VISIONES.filter((x) => x !== 'paridad')) {
    const { prefijo } = VISIONES_CON_PALETAS[v];
    for (const p of paletasDe(v)) for (const m of ['claro', 'oscuro']) for (const k of Object.keys(varsDePaleta(v, p.id, m === 'oscuro'))) assert.ok(k.startsWith(prefijo), `${v} ${k}`);
  }
});

test('los tokens de cada paleta son hex válidos y claro/oscuro definen las mismas claves', () => {
  for (const v of VISIONES) for (const p of paletasDe(v)) {
    assert.deepEqual(Object.keys(p.claro).sort(), Object.keys(p.oscuro).sort(), `${v}/${p.id}`);
    for (const m of ['claro', 'oscuro']) for (const [k, c] of Object.entries(p[m])) assert.match(c, /^#[0-9a-fA-F]{6}$/, `${v}/${p.id}/${m}/${k}`);
  }
});

test('contraste AA en cada paleta de cada visión, claro y oscuro', () => {
  const pares = { investigacion: PARES, pomodoro: PPARES.map(([a, b]) => [a, b, 4.5]) };
  for (const v of VISIONES) {
    for (const p of paletasDe(v)) for (const m of ['claro', 'oscuro']) {
      const base = VISIONES_CON_PALETAS[v].base?.[m] ?? {};
      const tokens = { ...base, ...p[m] };
      const problemas = problemasDeContraste(v, tokens, pares[v] ?? paresDe(v));
      assert.deepEqual(problemas, [], `${v}/${p.id}/${m}: ${problemas.join('; ')}`);
    }
  }
});

test('las bases copiadas de calma.css y vision.css siguen siendo las del CSS y también cumplen AA', () => {
  for (const [v, css, pref] of [['calma', '../calma/calma.css', '--vc-'], ['vision', '../vision/vision.css', '--vv-']]) {
    const texto = readFileSync(join(aqui, css), 'utf8');
    for (const m of ['claro', 'oscuro']) {
      const base = VISIONES_CON_PALETAS[v].base[m];
      const bloque = m === 'claro' ? texto.slice(0, texto.indexOf(":root[data-theme='dark']")) : texto.slice(texto.indexOf(":root[data-theme='dark']"));
      for (const [k, c] of Object.entries(base)) {
        const re = new RegExp(`${pref}${k}:\\s*(#[0-9a-fA-F]{6})`);
        const hallado = bloque.match(re)?.[1];
        assert.ok(hallado, `${v} ${m} ${k} no está en el CSS`);
        assert.equal(hallado.toLowerCase(), c.toLowerCase(), `${v} ${m} ${k}`);
      }
      assert.deepEqual(problemasDeContraste(v, base), [], `${v} base ${m}`);
    }
  }
  for (const [nombre, t] of [['investigacion claro', CLARO], ['investigacion oscuro', OSCURO]]) assert.deepEqual(problemasDeContraste('investigacion', t, PARES), [], nombre);
  for (const [nombre, t] of [['pomodoro claro', PCLARO], ['pomodoro oscuro', POSCURO]]) assert.deepEqual(problemasDeContraste('pomodoro', t, PPARES.map(([a, b]) => [a, b, 4.5])), [], nombre);
});

test('varsDePaleta y muestraDe: vacío para la predeterminada y valores del tema pedido', () => {
  assert.deepEqual(varsDePaleta('calma', PREDETERMINADA, false), {});
  assert.deepEqual(varsDePaleta('calma', 'nada', false), {});
  assert.deepEqual(varsDePaleta('nada', 'amanecer', false), {});
  assert.equal(varsDePaleta('calma', 'amanecer', false)['--vc-fondo'], '#FBEFE6');
  assert.equal(varsDePaleta('calma', 'amanecer', true)['--vc-fondo'], '#2E1F1C');
  assert.equal(varsDePaleta('paridad', 'cielo', false)['--primary'], '#1b5f9e');
  assert.equal(muestraDe('calma', PREDETERMINADA, false), null);
  assert.equal(muestraDe('pomodoro', 'grafito', true).length, 4);
});

test('guardar y cargar usan una clave propia por visión y toleran fallos', () => {
  const st = storage();
  assert.equal(cargarPaletaVision(st, 'calma'), PREDETERMINADA);
  guardarPaletaVision(st, 'calma', 'medianoche');
  guardarPaletaVision(st, 'pomodoro', 'grafito');
  assert.deepEqual([...st.m.keys()].sort(), [claveDe('calma'), claveDe('pomodoro')].sort());
  assert.match(claveDe('calma'), /^kairos_pomodoro_vision_calma_/);
  assert.equal(cargarPaletaVision(st, 'calma'), 'medianoche');
  assert.equal(cargarPaletaVision(st, 'vision'), PREDETERMINADA);
  // una paleta de otra visión no vale
  assert.equal(esPaletaDe('calma', 'grafito'), false);
  assert.equal(cargarPaletaVision(storage({ [claveDe('calma')]: JSON.stringify({ id: 'grafito' }) }), 'calma'), PREDETERMINADA);
  guardarPaletaVision(st, 'calma', PREDETERMINADA);
  assert.equal(st.m.has(claveDe('calma')), false);
  assert.equal(cargarPaletaVision(storage({ [claveDe('calma')]: '{rota' }), 'calma'), PREDETERMINADA);
  assert.equal(cargarPaletaVision(null, 'calma'), PREDETERMINADA);
  assert.doesNotThrow(() => guardarPaletaVision({ setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } }, 'calma', 'amanecer'));
  assert.equal(cargarPaletaVision({ getItem() { throw new Error('x'); } }, 'calma'), PREDETERMINADA);
});
