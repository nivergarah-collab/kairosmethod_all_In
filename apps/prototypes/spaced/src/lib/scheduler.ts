/* Programador de repasos: SM-2 (SuperMemo), según la especificación oficial
   de P.A. Wozniak (supermemo.com/english/ol/sm2.htm):

   - E-Factor inicial 2.5, piso 1.3.
   - EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)); para q = 4 no cambia.
   - Intervalos: I(1) = 1, I(2) = 6, I(n) = I(n-1) * EF (redondeado hacia arriba).
   - Si q < 3: se reinicia la secuencia desde I(1) SIN cambiar el EF.
   - Tope de intervalo: 3650 días (10 años) para que ninguna ficha se pierda. */

import type { Card, Phase, Quality } from '../types';
import { addDays } from './dates';

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_INTERVAL_DAYS = 3650;
/** Umbral de ficha "dominada" (convención de Anki: 21 días). */
export const MATURE_INTERVAL_DAYS = 21;

export const PHASE_LABEL: Record<Phase, string> = {
  new: 'Nuevas',
  learning: 'Aprendiendo',
  reviewing: 'Repasando',
  mastered: 'Dominadas',
};

export const PHASE_HINT: Record<Phase, string> = {
  new: 'sin repasar',
  learning: '≤ 6 días',
  reviewing: '7 – 20 días',
  mastered: '21+ días',
};

/** EF' según la fórmula de SM-2 (q < 3 no modifica el EF). */
export function updatedEase(ease: number, q: Quality): number {
  if (q < 3) return ease;
  const next = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Math.max(MIN_EASE, next);
}

/** Calcula el intervalo de la n-ésima repetición según SM-2. */
export function intervalFor(reps: number, prevInterval: number, ease: number): number {
  if (reps <= 1) return 1;
  if (reps === 2) return 6;
  return Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.ceil(prevInterval * ease)));
}

/** Aplica una calificación a una ficha y devuelve la nueva versión. */
export function rateCard(card: Card, q: Quality, today: string): Card {
  if (q < 3) {
    // Falló: vuelve a empezar la secuencia (EF intacto) y queda para hoy.
    return { ...card, reps: 0, interval: 0, due: today, lastReview: today };
  }
  const reps = card.reps + 1;
  const interval = intervalFor(reps, card.interval, card.ease);
  return {
    ...card,
    reps,
    interval,
    ease: updatedEase(card.ease, q),
    due: addDays(today, interval),
    lastReview: today,
  };
}

/** Fase de la ficha para las cintas del libro. */
export function phaseOf(card: Card): Phase {
  if (card.reps === 0 && card.lastReview === null) return 'new';
  if (card.interval <= 6) return 'learning';
  if (card.interval < MATURE_INTERVAL_DAYS) return 'reviewing';
  return 'mastered';
}
