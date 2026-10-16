import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_VISION, VISIONS, getVision, isVisionId, moveIndex } from './registry.js';

test('hay cinco visiones con id único y colores de vista previa válidos', () => {
  assert.deepEqual(VISIONS.map((v) => v.name), ['Pomodoro', 'Calma', 'Visión', 'Paridad', 'Investigación']);
  assert.equal(new Set(VISIONS.map((v) => v.id)).size, 5);
  for (const v of VISIONS) {
    for (const c of Object.values(v.preview)) assert.match(c, /^#[0-9a-f]{6}$/i);
    assert.ok(v.tagline.length > 0 && v.source.length > 0);
  }
});

test('getVision devuelve la visión por defecto ante un id desconocido', () => {
  assert.equal(getVision('calma').name, 'Calma');
  assert.equal(getVision('nada').id, DEFAULT_VISION);
  assert.equal(isVisionId('vision'), true);
  assert.equal(isVisionId('nada'), false);
});

test('moveIndex recorre la lista en círculo con las flechas', () => {
  assert.equal(moveIndex(4, 'ArrowRight', 5), 0);
  assert.equal(moveIndex(0, 'ArrowLeft', 5), 4);
  assert.equal(moveIndex(1, 'ArrowRight', 5), 2);
  assert.equal(moveIndex(2, 'Home', 5), 0);
  assert.equal(moveIndex(2, 'End', 5), 4);
  assert.equal(moveIndex(0, 'ArrowDown', 5, 2), 2);
  assert.equal(moveIndex(4, 'ArrowDown', 5, 2), 0);
  assert.equal(moveIndex(2, 'ArrowUp', 5, 2), 0);
  assert.equal(moveIndex(0, 'ArrowUp', 5, 2), 4);
  assert.equal(moveIndex(3, 'x', 5), 3);
  assert.equal(moveIndex(0, 'ArrowRight', 0), -1);
});

test('Paridad tiene capa propia y apunta al prototipo de referencia', () => {
  const v = getVision('paridad');
  assert.equal(v.implemented, true);
  assert.equal(v.source, 'pomodoro-paridad');
});
