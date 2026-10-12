import assert from 'node:assert/strict';
import test from 'node:test';
import { daysBetween, getGardenDate, localDayKey } from './time.js';

test('localDayKey usa la fecha local incluso cerca de medianoche', () => {
  const lateNight = new Date(2026, 9, 8, 23, 59, 59);
  const afterMidnight = new Date(2026, 9, 9, 0, 0, 1);

  assert.equal(localDayKey(lateNight), '2026-10-08');
  assert.equal(localDayKey(afterMidnight), '2026-10-09');
});

test('daysBetween cuenta días de calendario sin depender de cambios de horario', () => {
  assert.equal(daysBetween('2026-09-05', '2026-09-06'), 1);
  assert.equal(daysBetween('2026-09-06', '2026-09-05'), -1);
  assert.equal(daysBetween('2026-10-01', '2026-10-08'), 7);
});

test('la fecha virtual prevalece solo en demo y las fechas imposibles se rechazan', () => {
  const realNow = new Date(2026, 9, 8, 8, 30);
  const demoDate = getGardenDate({ clockMode: 'demo', virtualDate: '2026-10-10' }, realNow);
  const realDate = getGardenDate({ clockMode: 'real', virtualDate: null }, realNow);

  assert.equal(localDayKey(demoDate), '2026-10-10');
  assert.equal(localDayKey(realDate), '2026-10-08');
  assert.throws(() => daysBetween('2026-02-30', '2026-03-01'), /fecha/i);
  assert.throws(() => localDayKey(new Date(Number.NaN)), /fecha/i);
});
