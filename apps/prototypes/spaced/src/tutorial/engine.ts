/* Lógica pura del tutorial: avance, persistencia y posición de la tarjeta. */

export const TUTORIAL_KEY = 'kairos_spaced_tutorial_v1';

export interface TutorialStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): TutorialStorage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null; // acceso bloqueado (el propio getter puede lanzar)
  }
}

/** true si el tutorial debe abrirse solo (nunca se vio ni se saltó). */
export function shouldAutoOpen(storage: TutorialStorage | null = browserStorage()): boolean {
  if (!storage) return true;
  try {
    return storage.getItem(TUTORIAL_KEY) === null;
  } catch {
    return true; // sin almacenamiento no podemos recordar: se trata como primera vez
  }
}

/** Recuerda que el tutorial ya se vio o se saltó. Nunca lanza. */
export function markSeen(storage: TutorialStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(TUTORIAL_KEY, 'seen');
    return true;
  } catch {
    return false;
  }
}

export function clampIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(total - 1, Math.max(0, Math.trunc(index)));
}

export function nextIndex(index: number, total: number): number {
  return clampIndex(index + 1, total);
}

export function prevIndex(index: number, total: number): number {
  return clampIndex(index - 1, total);
}

export const isFirst = (index: number): boolean => index <= 0;
export const isLast = (index: number, total: number): boolean => index >= total - 1;

export function progressLabel(index: number, total: number): string {
  return `Paso ${clampIndex(index, total) + 1} de ${total}`;
}

/* ---------- Geometría ---------- */

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Placement = 'bottom' | 'top' | 'right' | 'left' | 'over' | 'center';

export interface CardPosition {
  top: number;
  left: number;
  placement: Placement;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Parte del rectángulo que cae dentro del viewport (alto/ancho >= 0). */
export function clipToViewport(rect: Rect, vp: Size): Rect {
  const left = clamp(rect.left, 0, vp.width);
  const top = clamp(rect.top, 0, vp.height);
  const right = clamp(rect.left + rect.width, 0, vp.width);
  const bottom = clamp(rect.top + rect.height, 0, vp.height);
  return { top, left, width: right - left, height: bottom - top };
}

/**
 * Coloca la tarjeta explicativa junto al elemento resaltado, siempre dentro del
 * viewport. Prefiere debajo, luego arriba, derecha e izquierda; si no cabe en
 * ninguno, la deja en la base de la pantalla encima del elemento ('over').
 */
export function computeCardPosition(
  target: Rect | null,
  card: Size,
  vp: Size,
  gap = 14,
  margin = 12
): CardPosition {
  const maxLeft = Math.max(margin, vp.width - card.width - margin);
  const maxTop = Math.max(margin, vp.height - card.height - margin);

  if (!target) {
    return {
      top: clamp((vp.height - card.height) / 2, margin, maxTop),
      left: clamp((vp.width - card.width) / 2, margin, maxLeft),
      placement: 'center',
    };
  }

  const centeredLeft = clamp(target.left + target.width / 2 - card.width / 2, margin, maxLeft);
  const sideTop = clamp(target.top, margin, maxTop);
  const below = vp.height - (target.top + target.height) - margin;
  const above = target.top - margin;
  const right = vp.width - (target.left + target.width) - margin;
  const left = target.left - margin;

  if (below >= card.height + gap) {
    return { top: target.top + target.height + gap, left: centeredLeft, placement: 'bottom' };
  }
  if (above >= card.height + gap) {
    return { top: target.top - gap - card.height, left: centeredLeft, placement: 'top' };
  }
  if (right >= card.width + gap) {
    return { top: sideTop, left: target.left + target.width + gap, placement: 'right' };
  }
  if (left >= card.width + gap) {
    return { top: sideTop, left: target.left - gap - card.width, placement: 'left' };
  }
  return { top: maxTop, left: centeredLeft, placement: 'over' };
}

/**
 * Cuántos píxeles debe moverse el elemento (positivo = hacia arriba, es decir,
 * scrollBy hacia abajo) para que elemento y tarjeta quepan juntos; si el
 * elemento es demasiado alto, deja su borde superior arriba.
 */
export function scrollDelta(target: Rect, cardHeight: number, vp: Size, gap = 14, margin = 12): number {
  const block = target.height + gap + cardHeight;
  const desiredTop = block + margin * 2 <= vp.height ? (vp.height - block) / 2 : margin;
  return target.top - desiredTop;
}
