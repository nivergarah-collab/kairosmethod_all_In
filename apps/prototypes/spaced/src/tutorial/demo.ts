/* Fichas de ejemplo del tutorial: viven solo en memoria y nunca se guardan. */

import type { AppState, Card } from '../types';
import { addDays } from '../lib/dates';
import { DEFAULT_EASE } from '../lib/scheduler';

function sample(
  n: number,
  today: string,
  question: string,
  answer: string,
  reps: number,
  interval: number,
  dueIn: number
): Card {
  return {
    id: `tour-demo-${n}`,
    question,
    answer,
    ease: DEFAULT_EASE,
    reps,
    interval,
    due: addDays(today, dueIn),
    order: n,
    lastReview: reps > 0 ? addDays(today, dueIn - interval) : null,
  };
}

export function buildDemoState(today: string, sound: boolean): AppState {
  return {
    cards: [
      sample(
        1,
        today,
        'Ejemplo: ¿qué es el efecto de espaciamiento?',
        'Recordar mejor repasando justo antes de olvidar, en vez de repasar todo seguido.',
        0,
        0,
        0
      ),
      sample(2, today, 'Ejemplo: ¿para qué sirve el E-Factor?', '', 0, 0, 0),
      sample(3, today, 'Ejemplo: ¿cuál es el intervalo tras el segundo acierto?', '6 días.', 2, 3, 1),
      sample(4, today, 'Ejemplo: ¿qué pasa si olvido una ficha?', 'La secuencia se reinicia.', 4, 12, 9),
      sample(5, today, 'Ejemplo: ¿quién creó SM-2?', 'P. A. Wozniak (SuperMemo).', 6, 30, 20),
    ],
    settings: { dailyGoal: 10, sound, periodEnd: addDays(today, 14) },
    progress: { date: today, rated: 4 },
    streak: { last: today, count: 3 },
  };
}
