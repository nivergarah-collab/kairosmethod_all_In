import test from 'node:test';
import assert from 'node:assert/strict';
import { cardStates, fmt, goalOf } from './model.js';

test('fmt da mm:ss y nunca negativo', () => {
  assert.equal(fmt(1500), '25:00');
  assert.equal(fmt(61), '01:01');
  assert.equal(fmt(-5), '00:00');
  assert.equal(fmt(59.9), '00:59');
});

test('goalOf usa un texto de respaldo para metas vacías', () => {
  assert.equal(goalOf({ goal: '  ' }), 'Estudio y concentración profunda');
  assert.equal(goalOf({ goal: 'Álgebra' }), 'Álgebra');
});

test('cardStates marca la ficha abierta en enfoque y la siguiente en descanso', () => {
  const blocks = [1, 2, 3].map((index) => ({ index, goal: `B${index}`, isCompleted: index === 1 }));
  assert.deepEqual(cardStates(blocks, 2, 'FOCUS').map((c) => c.kind), ['done', 'open', 'pending']);
  assert.deepEqual(cardStates(blocks, 1, 'SHORT_BREAK').map((c) => c.kind), ['done', 'next', 'pending']);
  assert.equal(cardStates(blocks, 1, 'FOCUS')[0].kind, 'open');
});
