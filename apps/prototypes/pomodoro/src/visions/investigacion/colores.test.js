import test from 'node:test';
import assert from 'node:assert/strict';
import { CLARO, OSCURO, CLARO_ALTO, OSCURO_ALTO, PARES, PARES_ALTO, contraste, luminancia, tokensPara } from './colores.js';

const comprobar = (nombre, tokens, pares) => {
  for (const [a, b, min] of pares) {
    const c = contraste(tokens[a], tokens[b]);
    assert.ok(c >= min, `${nombre}: ${a} sobre ${b} = ${c.toFixed(2)} (mínimo ${min})`);
  }
};

test('contraste de referencia', () => {
  assert.equal(Math.round(contraste('#000000', '#ffffff')), 21);
  assert.equal(contraste('#ffffff', '#ffffff'), 1);
  assert.ok(luminancia('#ffffff') > luminancia('#000000'));
});

test('el tema claro y el oscuro cumplen AA en todos los pares', () => {
  comprobar('claro', CLARO, PARES);
  comprobar('oscuro', OSCURO, PARES);
});

test('las variantes de alto contraste cumplen 7:1 en texto y 4,5:1 en componentes', () => {
  comprobar('claro alto', CLARO_ALTO, PARES_ALTO);
  comprobar('oscuro alto', OSCURO_ALTO, PARES_ALTO);
});

test('todos los tokens son colores hex válidos y comparten las mismas claves', () => {
  const claves = Object.keys(CLARO).sort();
  for (const t of [CLARO, OSCURO, CLARO_ALTO, OSCURO_ALTO]) {
    assert.deepEqual(Object.keys(t).sort(), claves);
    for (const v of Object.values(t)) assert.match(v, /^#[0-9a-f]{6}$/i);
  }
});

test('tokensPara elige según tema y contraste', () => {
  assert.equal(tokensPara({ oscuro: false, altoContraste: false }), CLARO);
  assert.equal(tokensPara({ oscuro: true, altoContraste: false }), OSCURO);
  assert.equal(tokensPara({ oscuro: false, altoContraste: true }), CLARO_ALTO);
  assert.equal(tokensPara({ oscuro: true, altoContraste: true }), OSCURO_ALTO);
});
