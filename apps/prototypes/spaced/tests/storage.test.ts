import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GOAL,
  STORAGE_KEY,
  defaultState,
  loadState,
  saveState,
  type StorageLike,
} from '../src/lib/storage';

function makeStorage(init: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(init));
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

const LEGACY_V1 = 'spaced-repetition/v1';
const LEGACY_V2 = 'spaced-repetition/v2';

const TODAY = '2026-10-08';

describe('persistencia v3', () => {
  it('arranca vacío (sin fichas de ejemplo)', () => {
    const state = loadState(makeStorage());
    expect(state.cards).toEqual([]);
    expect(state.settings.dailyGoal).toBe(DEFAULT_GOAL);
    expect(state.settings.sound).toBe(true);
    expect(state.settings.periodEnd).toBeNull();
  });

  it('sin navegador devuelve estado por defecto', () => {
    const state = loadState(null);
    expect(state.cards).toEqual([]);
  });

  it('guarda y recarga v3', () => {
    const storage = makeStorage();
    const state = defaultState();
    state.cards = [
      { id: 'x', question: '¿P?', answer: 'R', ease: 2.5, reps: 2, interval: 6, due: TODAY, order: 1, lastReview: TODAY },
    ];
    saveState(state, storage);
    const loaded = loadState(storage);
    expect(loaded.cards[0].question).toBe('¿P?');
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).version).toBe(3);
  });

  it('datos corruptos → estado por defecto', () => {
    const storage = makeStorage({ [STORAGE_KEY]: '{no-json' });
    expect(loadState(storage).cards).toEqual([]);
  });
});

describe('migración v1 y v2', () => {
  it('migra v2 a v3 (cajas → intervalos) sin borrar v2', () => {
    const v2 = {
      version: 2,
      cards: [
        { id: 'c1', q: '¿P1?', a: 'R1', box: 1, due: TODAY, order: 1, reviews: 0, lastReview: null },
        { id: 'c3', q: '¿P3?', a: 'R3', box: 3, due: '2026-10-11', order: 3, reviews: 4, lastReview: '2026-10-05' },
      ],
      settings: { dailyGoal: 7, sound: false },
      progress: { date: TODAY, rated: 3 },
      streak: { last: TODAY, count: 5 },
    };
    const storage = makeStorage({ [LEGACY_V2]: JSON.stringify(v2) });
    const state = loadState(storage);

    expect(storage.getItem(LEGACY_V2)).not.toBeNull(); // respaldo intacto
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull(); // v3 escrita

    const c1 = state.cards.find((c) => c.id === 'c1')!;
    expect(c1.question).toBe('¿P1?');
    expect(c1.interval).toBe(0);
    expect(c1.reps).toBe(0);

    const c3 = state.cards.find((c) => c.id === 'c3')!;
    expect(c3.interval).toBe(3); // box 3 → 3 días
    expect(c3.reps).toBe(4);
    expect(c3.ease).toBe(2.5);

    expect(state.settings.dailyGoal).toBe(7);
    expect(state.settings.sound).toBe(false);
    expect(state.streak.count).toBe(5);
  });

  it('migra v1 (solo fichas) a v3', () => {
    const v1 = JSON.stringify({
      version: 1,
      cards: [{ id: 'x1', q: '¿P?', a: 'R', box: 2, due: TODAY, order: 1, reviews: 1, lastReview: null }],
    });
    const storage = makeStorage({ [LEGACY_V1]: v1 });
    const state = loadState(storage);
    expect(state.cards[0].interval).toBe(1); // box 2 → 1 día
    expect(state.settings.dailyGoal).toBe(DEFAULT_GOAL);
  });

  it('v3 tiene prioridad sobre v1/v2', () => {
    const storage = makeStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 3, ...defaultState() }),
      [LEGACY_V1]: JSON.stringify({
        version: 1,
        cards: [{ id: 'vieja', q: '¿?', a: 'R', box: 1, due: TODAY, order: 1, reviews: 0, lastReview: null }],
      }),
    });
    const state = loadState(storage);
    expect(state.cards.length).toBe(0); // se usa v3 (vacía), no v1
    expect(storage.getItem(LEGACY_V1)).not.toBeNull(); // v1 intacta
  });

  it('meta inválida se reencuadra al rango', () => {
    const storage = makeStorage({
      [STORAGE_KEY]: JSON.stringify({
        version: 3,
        ...defaultState(),
        settings: { dailyGoal: 0, sound: true, periodEnd: null },
      }),
    });
    expect(loadState(storage).settings.dailyGoal).toBe(1);
  });
});