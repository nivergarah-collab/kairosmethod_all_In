/* Tipos compartidos de la app (v3). */

/** Calificación en la escala 0-5 de SM-2.
 *  1 = falló (reinicia la secuencia), 3 = difícil, 4 = bien, 5 = fácil.
 *  (2 no se usa: en SM-2 todo q < 3 reinicia.) */
export type Quality = 1 | 3 | 4 | 5;

export interface Card {
  id: string;
  question: string;
  /** Respuesta escrita por el estudiante. Puede quedar vacía (repaso oral). */
  answer: string;
  /** E-Factor de SM-2. Inicial 2.5, piso 1.3. */
  ease: number;
  /** Repeticiones exitosas consecutivas (n del algoritmo). */
  reps: number;
  /** Último intervalo programado, en días. */
  interval: number;
  /** Próximo repaso (YYYY-MM-DD, zona local). */
  due: string;
  /** Orden en la cola diaria (desempate; sube al fallar para re-encolar al final). */
  order: number;
  lastReview: string | null;
}

export interface Settings {
  dailyGoal: number;
  sound: boolean;
  /** Fecha objetivo del periodo de estudio (ej. día del examen). null = sin definir. */
  periodEnd: string | null;
}

export interface Progress {
  date: string | null;
  rated: number;
}

export interface Streak {
  last: string | null;
  count: number;
}

export interface AppState {
  cards: Card[];
  settings: Settings;
  progress: Progress;
  streak: Streak;
}

/** Fases derivadas del intervalo (las cintas del libro). */
export type Phase = 'new' | 'learning' | 'reviewing' | 'mastered';
