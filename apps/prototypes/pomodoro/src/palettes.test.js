import test from 'node:test';
import assert from 'node:assert/strict';
import { PALETAS, PALETA_INICIAL, PALETTE_KEY, PARES_GRAFICOS, PARES_TEXTO, aplicarPaleta, cargarPaleta, contraste, esPaleta, guardarPaleta, paletaDe, rolesDe } from './palettes.js';

const fakeRoot = () => {
  const props = new Map();
  return { dataset: {}, props, style: { setProperty: (k, v) => props.set(k, v), removeProperty: (k) => props.delete(k) } };
};
const fakeStorage = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), m };
};

test('hay la paleta original más tres, una de ellas la de Pomodoro visión', () => {
  assert.deepEqual(PALETAS.map((p) => p.id), ['base', 'salvia', 'oceano', 'ciruela']);
  assert.equal(PALETAS.length - 1, 3);
  assert.match(paletaDe('salvia').origen, /pomodoro-vision/);
  assert.equal(paletaDe('salvia').claro.background, '#f1ebdd'); // los acentos se ajustaron un poco para cumplir AA sobre sus tintes
  assert.equal(paletaDe('salvia').oscuro.background, '#2a211b');
  assert.equal(paletaDe('nada').id, 'base');
  assert.equal(esPaleta('oceano'), true);
  assert.equal(esPaleta('x'), false);
});

test('todas las paletas definen los mismos roles en claro y oscuro', () => {
  const ref = Object.keys(paletaDe('salvia').claro).sort();
  for (const p of PALETAS.slice(1)) for (const m of ['claro', 'oscuro']) assert.deepEqual(Object.keys(p[m]).sort(), ref, `${p.id} ${m}`);
  for (const p of PALETAS.slice(1)) for (const m of ['claro', 'oscuro']) for (const [k, v] of Object.entries(p[m])) assert.match(v, /^#[0-9a-f]{6}$/, `${p.id} ${m} ${k}`);
});

test('contraste AA: texto 4.5:1 y elementos gráficos 3:1 en cada paleta, claro y oscuro', () => {
  for (const p of PALETAS.slice(1)) {
    for (const m of ['claro', 'oscuro']) {
      for (const [a, b] of PARES_TEXTO) assert.ok(contraste(p[m][a], p[m][b]) >= 4.5, `${p.id} ${m}: ${a} sobre ${b} = ${contraste(p[m][a], p[m][b]).toFixed(2)}`);
      for (const [a, b] of PARES_GRAFICOS) assert.ok(contraste(p[m][a], p[m][b]) >= 3, `${p.id} ${m}: ${a} sobre ${b} = ${contraste(p[m][a], p[m][b]).toFixed(2)}`);
    }
  }
});

const mezcla = (fg, bg, a) => {
  const f = [1, 3, 5].map((i) => parseInt(fg.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
  return `#${f.map((v, i) => Math.round(v * a + b[i] * (1 - a)).toString(16).padStart(2, '0')).join('')}`;
};

test('el texto de color de la paleta se lee sobre su propio tinte (12–20 % sobre superficie y fondo): 4,5:1', () => {
  for (const p of PALETAS.slice(1)) for (const m of ['claro', 'oscuro']) {
    for (const rol of ['primary', 'secondary', 'tertiary', 'pomo-accent-gold']) for (const base of ['surface', 'background']) for (const a of [0.12, 0.18, 0.2]) {
      const t = p[m];
      const c = contraste(t[rol], mezcla(t[rol], t[base], a));
      assert.ok(c >= 4.5, `${p.id} ${m}: ${rol} sobre su tinte ${a} de ${base} = ${c.toFixed(2)}`);
    }
  }
});

test('las paletas son distintas entre sí', () => {
  const firmas = PALETAS.slice(1).flatMap((p) => [p.claro.primary, p.oscuro.primary]);
  assert.equal(new Set(firmas).size, firmas.length);
});

test('aplicarPaleta pone y quita las variables y el atributo', () => {
  const root = fakeRoot();
  assert.deepEqual(aplicarPaleta(root, 'base', false), []);
  assert.equal(root.props.size, 0);
  const n = aplicarPaleta(root, 'oceano', true).length;
  assert.ok(n > 25);
  assert.equal(root.props.get('--background'), rolesDe('oceano', true).background);
  assert.equal(root.dataset.palette, 'oceano');
  aplicarPaleta(root, 'oceano', false);
  assert.equal(root.props.get('--background'), rolesDe('oceano', false).background);
  aplicarPaleta(root, 'base', false);
  assert.equal(root.props.size, 0);
  assert.equal(root.dataset.palette, undefined);
});

test('guardar y cargar usan solo la clave propia y toleran fallos', () => {
  const st = fakeStorage();
  assert.equal(cargarPaleta(st), PALETA_INICIAL);
  guardarPaleta(st, 'ciruela');
  assert.deepEqual([...st.m.keys()], [PALETTE_KEY]);
  assert.match(PALETTE_KEY, /^kairos_pomodoro_/);
  assert.equal(cargarPaleta(st), 'ciruela');
  guardarPaleta(st, 'base');
  assert.equal(st.m.size, 0);
  assert.equal(cargarPaleta(fakeStorage({ [PALETTE_KEY]: '{rota' })), PALETA_INICIAL);
  assert.equal(cargarPaleta(fakeStorage({ [PALETTE_KEY]: JSON.stringify({ id: 'inventada' }) })), PALETA_INICIAL);
  assert.equal(cargarPaleta(null), PALETA_INICIAL);
  assert.doesNotThrow(() => guardarPaleta({ setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } }, 'salvia'));
  assert.doesNotThrow(() => guardarPaleta(null, 'salvia'));
  assert.equal(cargarPaleta({ getItem() { throw new Error('x'); } }), PALETA_INICIAL);
});
