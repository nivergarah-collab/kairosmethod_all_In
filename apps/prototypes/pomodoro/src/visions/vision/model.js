// Modelo de presentación de la visión «Visión». Puro: solo da formato al estado del contrato.

/** mm:ss con ceros a la izquierda; nunca negativo. */
export const fmt = (seconds) => {
  const s = Math.max(0, Math.trunc(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** Meta visible de un bloque (con texto de respaldo si está vacía). */
export const goalOf = (block) => (String(block.goal ?? '').trim() === '' ? 'Estudio y concentración profunda' : block.goal);

/**
 * Estado de cada ficha del mapa: 'open' (la del bloque actual en enfoque), 'done', 'next' (la siguiente
 * durante el descanso) o 'pending'.
 */
export function cardStates(blocks, currentIndex, phase) {
  return blocks.map((b) => {
    let kind = 'pending';
    if (b.isCompleted) kind = 'done';
    if (phase === 'FOCUS' && b.index === currentIndex) kind = 'open';
    else if (phase !== 'FOCUS' && b.index === currentIndex + 1) kind = b.isCompleted ? 'done' : 'next';
    return { index: b.index, goal: goalOf(b), kind, done: b.isCompleted };
  });
}
