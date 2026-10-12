/* Selectores derivados del estado (para la interfaz). */

import type { AppState, Card, Phase } from '../types';
import { addDays, todayKey } from '../lib/dates';
import { phaseOf } from '../lib/scheduler';

/** Fichas vencidas hoy, en orden (vencidas primero, luego por orden). */
export function dueCards(state: AppState): Card[] {
  const t = todayKey();
  return state.cards
    .filter((c) => c.due <= t)
    .sort((a, b) => (a.due === b.due ? a.order - b.order : a.due < b.due ? -1 : 1));
}

export function queueCount(state: AppState): number {
  return dueCards(state).length;
}

export function tomorrowCount(state: AppState): number {
  const tomorrow = addDays(todayKey(), 1);
  return state.cards.filter((c) => c.due === tomorrow).length;
}

export function phaseCounts(state: AppState): Record<Phase, number> {
  const counts: Record<Phase, number> = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
  for (const c of state.cards) counts[phaseOf(c)] += 1;
  return counts;
}

export interface AgendaEntry {
  date: string;
  count: number;
}

export function agendaEntries(state: AppState, limit = 8): AgendaEntry[] {
  const t = todayKey();
  const map = new Map<string, number>();
  for (const c of state.cards) {
    if (c.due <= t) continue;
    map.set(c.due, (map.get(c.due) || 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(0, limit)
    .map(([date, count]) => ({ date, count }));
}

export function goalProgress(state: AppState): number {
  return Math.min(state.progress.rated, state.settings.dailyGoal);
}

export function goalDone(state: AppState): boolean {
  return state.progress.rated >= state.settings.dailyGoal;
}