/* Persistencia en localStorage, versión 3.
   - La app arranca VACÍA: no se siembran fichas de ejemplo.
   - Migración automática v1 -> v2 -> v3. Las claves anteriores se conservan
     como respaldo (no se borran). */

import type { AppState, Card } from '../types';
import { DEFAULT_EASE } from './scheduler';

export const STORAGE_KEY = 'spaced-repetition/v3';
const LEGACY_V2 = 'spaced-repetition/v2';
const LEGACY_V1 = 'spaced-repetition/v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const DEFAULT_GOAL = 10;

export function defaultState(): AppState {
  return {
    cards: [],
    settings: { dailyGoal: DEFAULT_GOAL, sound: true, periodEnd: null },
    progress: { date: null, rated: 0 },
    streak: { last: null, count: 0 },
  };
}

function browserStorage(): StorageLike | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

const BOX_INTERVAL: Record<number, number> = { 1: 0, 2: 1, 3: 3, 4: 7 };

interface LegacyCard {
  id: string;
  q: string;
  a: string;
  box: number;
  due: string;
  order: number;
  reviews: number;
  lastReview: string | null;
}

interface LegacyData {
  cards?: LegacyCard[];
  settings?: Partial<AppState['settings']>;
  progress?: AppState['progress'];
  streak?: AppState['streak'];
}

function toV3Card(c: LegacyCard, index: number): Card {
  return {
    id: c.id,
    question: c.q,
    answer: c.a,
    ease: DEFAULT_EASE,
    reps: c.reviews ?? 0,
    interval: BOX_INTERVAL[c.box] ?? 0,
    due: c.due,
    order: c.order ?? index,
    lastReview: c.lastReview ?? null,
  };
}

function mergeSettings(raw: Partial<AppState['settings']> | undefined): AppState['settings'] {
  const base = defaultState().settings;
  const merged = { ...base, ...(raw || {}) };
  const goal = Number(merged.dailyGoal);
  merged.dailyGoal = Number.isFinite(goal) ? Math.min(99, Math.max(1, goal)) : DEFAULT_GOAL;
  return merged;
}

function fromV1orV2(raw: LegacyData): AppState {
  const base = defaultState();
  return {
    cards: Array.isArray(raw.cards) ? raw.cards.map((c, i) => toV3Card(c, i)) : [],
    settings: mergeSettings(raw.settings),
    progress: { ...base.progress, ...(raw.progress || {}) },
    streak: { ...base.streak, ...(raw.streak || {}) },
  };
}

function parse<T>(storage: StorageLike, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as T;
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

function readV3(storage: StorageLike): AppState | null {
  const data = parse<AppState & { version?: number }>(storage, STORAGE_KEY);
  if (!data || data.version !== 3 || !Array.isArray(data.cards)) return null;
  return {
    cards: data.cards,
    settings: mergeSettings(data.settings),
    progress: { ...defaultState().progress, ...(data.progress || {}) },
    streak: { ...defaultState().streak, ...(data.streak || {}) },
  };
}

function writeV3(storage: StorageLike, state: AppState) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 3, ...state }));
  } catch {
    /* almacenamiento no disponible: la sesión sigue en memoria */
  }
}

export function loadState(storage: StorageLike | null = browserStorage()): AppState {
  if (!storage) return defaultState();

  const v3 = readV3(storage);
  if (v3) return v3;

  const v2 = parse<LegacyData>(storage, LEGACY_V2);
  if (v2 && Array.isArray(v2.cards)) {
    const state = fromV1orV2(v2);
    writeV3(storage, state); // primera versión escrita de la migración
    return state;
  }

  const v1 = parse<LegacyData>(storage, LEGACY_V1);
  if (v1 && Array.isArray(v1.cards)) {
    const state = fromV1orV2(v1);
    writeV3(storage, state);
    return state;
  }

  return defaultState();
}

export function saveState(state: AppState, storage: StorageLike | null = browserStorage()) {
  if (!storage) return;
  writeV3(storage, state);
}