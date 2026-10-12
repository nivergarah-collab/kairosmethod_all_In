import { describe, expect, it } from 'vitest';
import { defaultState } from '../src/lib/storage';
import { reducer } from '../src/state/reducer';
import type { AppState, Quality } from '../src/types';

const TODAY = '2026-10-08';
const NEXT = '2026-10-09';
const AFTER = '2026-10-15';

function fresh(): AppState {
  return defaultState();
}

function withCards(count: number, today = TODAY): AppState {
  let s = fresh();
  for (let i = 1; i <= count; i += 1) {
    s = reducer(s, { type: 'addCard', question: `P${i}`, answer: `R${i}`, today });
  }
  return s;
}

function rate(s: AppState, id: string, q: Quality, today: string): AppState {
  return reducer(s, { type: 'rate', id, quality: q, today });
}

describe('agregar y borrar fichas', () => {
  it('no crea fichas vacías ni sin pregunta', () => {
    expect(reducer(fresh(), { type: 'addCard', question: '   ', answer: 'R', today: TODAY }).cards.length).toBe(0);
  });

  it('cada ficha nueva entra en la cola de hoy y recibe orden', () => {
    const s = withCards(3);
    expect(s.cards.map((c) => c.order)).toEqual([1, 2, 3]);
    expect(s.cards.every((c) => c.due === TODAY)).toBe(true);
    expect(s.cards.every((c) => c.ease === 2.5)).toBe(true);
  });

  it('editar cambia pregunta y respuesta', () => {
    let s = withCards(1);
    s = reducer(s, { type: 'updateCard', id: s.cards[0].id, question: '¿Nueva?', answer: 'Nueva R' });
    expect(s.cards[0].question).toBe('¿Nueva?');
    expect(s.cards[0].answer).toBe('Nueva R');
  });

  it('borrar elimina la ficha', () => {
    const s = withCards(2);
    const id = s.cards[0].id;
    const after = reducer(s, { type: 'deleteCard', id });
    expect(after.cards.length).toBe(1);
    expect(after.cards[0].id).not.toBe(id);
  });
});

describe('calificar con SM-2', () => {
  it('bien → repaso en 1 día, luego 6, luego 15', () => {
    let s = withCards(1);
    const id = s.cards[0].id;

    s = rate(s, id, 4, TODAY);
    expect(s.cards[0]).toMatchObject({ reps: 1, interval: 1, due: NEXT });

    s = rate(s, id, 4, NEXT);
    expect(s.cards[0]).toMatchObject({ reps: 2, interval: 6, due: AFTER });

    s = rate(s, id, 4, AFTER);
    expect(s.cards[0]).toMatchObject({ reps: 3, interval: 15, due: '2026-10-30' });
  });

  it('fallar re-encola al final de la cola de hoy', () => {
    let s = withCards(2);
    const [first, second] = [s.cards[0], s.cards[1]];
    s = rate(s, first.id, 1, TODAY);
    expect(s.cards.find((c) => c.id === first.id)!.order).toBeGreaterThan(second.order);
    expect(s.cards.find((c) => c.id === first.id)!.due).toBe(TODAY);
  });

  it('fallar no castiga el EF', () => {
    let s = withCards(1);
    const id = s.cards[0].id;
    s = rate(s, id, 4, TODAY); // 2.5
    s = rate(s, id, 3, NEXT); // 2.36
    s = rate(s, id, 1, AFTER);
    expect(s.cards[0].ease).toBeCloseTo(2.36);
    expect(s.cards[0].reps).toBe(0);
  });
});

describe('meta del día', () => {
  it('reinicia el progreso al cambiar de día', () => {
    let s = withCards(1);
    s = rate(s, s.cards[0].id, 4, TODAY);
    s = rate(s, s.cards[0].id, 4, NEXT);
    expect(s.progress.rated).toBe(1);
    expect(s.progress.date).toBe(NEXT);
  });

  it('la meta se reencuadra a 1..99', () => {
    expect(reducer(fresh(), { type: 'setGoal', value: 50 }).settings.dailyGoal).toBe(50);
    expect(reducer(fresh(), { type: 'setGoal', value: 0 }).settings.dailyGoal).toBe(1);
    expect(reducer(fresh(), { type: 'setGoal', value: 150 }).settings.dailyGoal).toBe(99);
  });
});

describe('racha', () => {
  it('primer día = 1 y mismo día no incrementa', () => {
    let s = withCards(2);
    s = rate(s, s.cards[0].id, 4, TODAY);
    expect(s.streak).toMatchObject({ last: TODAY, count: 1 });
    s = rate(s, s.cards[1].id, 4, TODAY);
    expect(s.streak.count).toBe(1);
  });

  it('día siguiente encadena', () => {
    let s = withCards(1);
    s = rate(s, s.cards[0].id, 4, TODAY);
    s = rate(s, s.cards[0].id, 4, NEXT);
    expect(s.streak.count).toBe(2);
  });

  it('un hueco rompe la racha y vuelve a 1', () => {
    let s = withCards(1);
    s = rate(s, s.cards[0].id, 4, TODAY);
    s = rate(s, s.cards[0].id, 4, '2026-10-12');
    expect(s.streak.count).toBe(1);
    expect(s.streak.last).toBe('2026-10-12');
  });
});

describe('ajustes', () => {
  it('alterna sonido', () => {
    const s = reducer(fresh(), { type: 'toggleSound' });
    expect(s.settings.sound).toBe(false);
  });

  it('guarda la fecha objetivo del periodo', () => {
    let s = fresh();
    s = reducer(s, { type: 'setPeriodEnd', date: '2026-12-20' });
    expect(s.settings.periodEnd).toBe('2026-12-20');
    s = reducer(s, { type: 'setPeriodEnd', date: null });
    expect(s.settings.periodEnd).toBeNull();
  });
});