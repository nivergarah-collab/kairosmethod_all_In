import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, plural, todayKey, toKey } from '../src/lib/dates';

describe('fechas (zona local)', () => {
  it('addDays simple', () => {
    expect(addDays('2026-10-08', 1)).toBe('2026-10-09');
  });

  it('addDays cruza fin de mes', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('addDays respeta bisiesto', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('addDays negativos', () => {
    expect(addDays('2026-10-08', -1)).toBe('2026-10-07');
  });

  it('daysBetween normal y negativo', () => {
    expect(daysBetween('2026-10-08', '2026-10-15')).toBe(7);
    expect(daysBetween('2026-10-15', '2026-10-08')).toBe(-7);
    expect(daysBetween('2026-10-08', '2026-10-08')).toBe(0);
  });

  it('todayKey sigue el formato YYYY-MM-DD', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toKey(new Date())).toBe(todayKey());
  });

  it('plural', () => {
    expect(plural(1, 'tarjeta')).toBe('1 tarjeta');
    expect(plural(3, 'tarjeta')).toBe('3 tarjetas');
  });
});