import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EASE,
  MAX_INTERVAL_DAYS,
  MIN_EASE,
  intervalFor,
  phaseOf,
  rateCard,
  updatedEase,
} from '../src/lib/scheduler';
import type { Card } from '../src/types';

const TODAY = '2026-10-08';

function makeCard(over: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    question: '¿P?',
    answer: 'R',
    ease: DEFAULT_EASE,
    reps: 0,
    interval: 0,
    due: TODAY,
    order: 1,
    lastReview: null,
    ...over,
  };
}

describe('SM-2: E-Factor', () => {
  it('q = 4 no cambia el EF', () => {
    expect(updatedEase(DEFAULT_EASE, 4)).toBe(2.5);
  });

  it('q = 3 baja el EF en 0.14', () => {
    expect(updatedEase(DEFAULT_EASE, 3)).toBeCloseTo(2.36);
  });

  it('q = 5 sube el EF en 0.1', () => {
    expect(updatedEase(DEFAULT_EASE, 5)).toBeCloseTo(2.6);
  });

  it('q < 3 no modifica el EF', () => {
    expect(updatedEase(1.5, 1)).toBe(1.5);
  });

  it('EF nunca baja de 1.3', () => {
    expect(updatedEase(1.4, 3)).toBe(MIN_EASE);
  });
});

describe('SM-2: intervalos', () => {
  it('I(1) = 1, I(2) = 6', () => {
    expect(intervalFor(1, 0, 2.5)).toBe(1);
    expect(intervalFor(2, 1, 2.5)).toBe(6);
  });

  it('I(n) = I(n-1) * EF redondeado hacia arriba', () => {
    expect(intervalFor(3, 6, 2.5)).toBe(15);
    expect(intervalFor(3, 6, 2.36)).toBe(15); // ceil(14.16)
  });

  it('nunca devuelve 0 o negativos', () => {
    expect(intervalFor(3, 0, 2.5)).toBe(1);
  });

  it('respeta el tope máximo', () => {
    expect(intervalFor(10, 3000, 2.5)).toBeLessThanOrEqual(MAX_INTERVAL_DAYS);
  });
});

describe('SM-2: rateCard', () => {
  it('primera respuesta bien → repaso en 1 día', () => {
    const r = rateCard(makeCard(), 4, TODAY);
    expect(r.reps).toBe(1);
    expect(r.interval).toBe(1);
    expect(r.due).toBe('2026-10-09');
    expect(r.ease).toBe(2.5);
  });

  it('segunda respuesta bien → 6 días', () => {
    const r = rateCard(makeCard({ reps: 1, interval: 1, due: '2026-10-09' }), 4, '2026-10-09');
    expect(r.reps).toBe(2);
    expect(r.interval).toBe(6);
    expect(r.due).toBe('2026-10-15');
  });

  it('tercera respuesta bien → ceil(6 * 2.5) = 15 días', () => {
    const r = rateCard(makeCard({ reps: 2, interval: 6, due: '2026-10-15' }), 4, '2026-10-15');
    expect(r.reps).toBe(3);
    expect(r.interval).toBe(15);
    expect(r.due).toBe('2026-10-30');
  });

  it('fácil también parte de I(1) la primera vez y sube el EF', () => {
    const r = rateCard(makeCard(), 5, TODAY);
    expect(r.reps).toBe(1);
    expect(r.interval).toBe(1);
    expect(r.ease).toBeCloseTo(2.6);
  });

  it('fallar reinicia sin tocar el EF', () => {
    const card = makeCard({ ease: 2.36, reps: 3, interval: 15, due: TODAY });
    const r = rateCard(card, 1, TODAY);
    expect(r.reps).toBe(0);
    expect(r.interval).toBe(0);
    expect(r.due).toBe(TODAY);
    expect(r.ease).toBe(2.36);
    expect(r.lastReview).toBe(TODAY);
  });

  it('difícil baja el EF pero continúa la secuencia', () => {
    const card = makeCard({ ease: 2.5, reps: 2, interval: 6, due: TODAY });
    const r = rateCard(card, 3, TODAY);
    expect(r.reps).toBe(3);
    expect(r.interval).toBe(Math.ceil(6 * 2.5)); // usa el EF previo a la calificación
    expect(r.ease).toBeCloseTo(2.36);
  });
});

describe('SM-2: fases', () => {
  it('nueva sin repasar', () => {
    expect(phaseOf(makeCard())).toBe('new');
  });

  it('reaprendizaje tras fallar (reps 0, con historial)', () => {
    expect(phaseOf(makeCard({ reps: 0, lastReview: TODAY }))).toBe('learning');
  });

  it('aprendiendo hasta 6 días', () => {
    expect(phaseOf(makeCard({ reps: 2, interval: 6, lastReview: TODAY }))).toBe('learning');
  });

  it('repasando de 7 a 20 días', () => {
    expect(phaseOf(makeCard({ reps: 3, interval: 7, lastReview: TODAY }))).toBe('reviewing');
    expect(phaseOf(makeCard({ reps: 3, interval: 20, lastReview: TODAY }))).toBe('reviewing');
  });

  it('dominadas desde 21 días', () => {
    expect(phaseOf(makeCard({ reps: 3, interval: 21, lastReview: TODAY }))).toBe('mastered');
    expect(phaseOf(makeCard({ reps: 4, interval: 3650, lastReview: TODAY }))).toBe('mastered');
  });
});