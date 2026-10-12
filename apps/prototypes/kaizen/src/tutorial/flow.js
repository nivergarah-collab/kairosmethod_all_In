// Avance y retroceso del recorrido, sin React.
export function clampIndex(index, total) {
  if (!Number.isInteger(total) || total < 1) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), total - 1);
}

export function nextIndex(index, total) {
  return clampIndex(index + 1, total);
}

export function previousIndex(index, total) {
  return clampIndex(index - 1, total);
}

export const isFirstStep = (index) => index <= 0;
export const isLastStep = (index, total) => index >= total - 1;

export function progressLabel(index, total) {
  return `Paso ${clampIndex(index, total) + 1} de ${total}`;
}
