/* Reducer puro del estado (testeable: recibe `today` en cada acción). */

import type { AppState, Card, Quality } from '../types';
import { addDays } from '../lib/dates';
import { DEFAULT_EASE, rateCard } from '../lib/scheduler';

export type Action =
  | { type: 'rate'; id: string; quality: Quality; today: string }
  | { type: 'addCard'; question: string; answer: string; today: string }
  | { type: 'updateCard'; id: string; question: string; answer: string }
  | { type: 'deleteCard'; id: string }
  | { type: 'setGoal'; value: number }
  | { type: 'toggleSound' }
  | { type: 'setPeriodEnd'; date: string | null };

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function maxOrder(cards: Card[]): number {
  return cards.reduce((m, c) => Math.max(m, c.order), 0);
}

function clampGoal(value: number): number {
  return Number.isFinite(value) ? Math.min(99, Math.max(1, value)) : 10;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'rate': {
      const card = state.cards.find((c) => c.id === action.id);
      if (!card) return state;

      const today = action.today;
      let progress = state.progress;
      let streak = state.streak;

      // Nuevo día: reinicia el progreso; racha vencida se pone en 0.
      if (progress.date !== today) progress = { date: today, rated: 0 };
      if (streak.last && streak.last < addDays(today, -1)) streak = { ...streak, count: 0 };

      const rated = rateCard(card, action.quality, today);
      const fallo = action.quality < 3;
      const cards = state.cards.map((c) => {
        if (c.id !== rated.id) return c;
        // Si falló, re-encola al final de la cola de hoy.
        return fallo ? { ...rated, order: maxOrder(state.cards) + 1 } : rated;
      });

      progress = { date: today, rated: progress.rated + 1 };
      if (streak.last !== today) {
        streak = {
          last: today,
          count: streak.last === addDays(today, -1) ? streak.count + 1 : 1,
        };
      }

      return { ...state, cards, progress, streak };
    }

    case 'addCard': {
      const question = action.question.trim();
      const answer = action.answer.trim();
      if (!question) return state;
      const card: Card = {
        id: newId(),
        question,
        answer,
        ease: DEFAULT_EASE,
        reps: 0,
        interval: 0,
        due: action.today,
        order: maxOrder(state.cards) + 1,
        lastReview: null,
      };
      return { ...state, cards: [...state.cards, card] };
    }

    case 'updateCard': {
      const question = action.question.trim();
      if (!question) return state;
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.id ? { ...c, question, answer: action.answer.trim() } : c
        ),
      };
    }

    case 'deleteCard':
      return { ...state, cards: state.cards.filter((c) => c.id !== action.id) };

    case 'setGoal':
      return { ...state, settings: { ...state.settings, dailyGoal: clampGoal(action.value) } };

    case 'toggleSound':
      return { ...state, settings: { ...state.settings, sound: !state.settings.sound } };

    case 'setPeriodEnd':
      return { ...state, settings: { ...state.settings, periodEnd: action.date } };

    default:
      return state;
  }
}