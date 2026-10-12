// Avance y retroceso del recorrido (lógica pura, sin React).
export function createFlow(total) {
  return { index: 0, total: Math.max(0, total), finished: false };
}

export const isFirst = (flow) => flow.index === 0;
export const isLast = (flow) => flow.index >= flow.total - 1;

export function next(flow) {
  if (flow.finished) return flow;
  if (isLast(flow)) return { ...flow, finished: true };
  return { ...flow, index: flow.index + 1 };
}

export function prev(flow) {
  if (flow.finished || isFirst(flow)) return flow;
  return { ...flow, index: flow.index - 1 };
}

export function progressLabel(flow) {
  return `Paso ${Math.min(flow.index + 1, flow.total)} de ${flow.total}`;
}

// Avance entre 0 y 1 (para la barra de progreso).
export function progressFraction(flow) {
  return flow.total === 0 ? 0 : Math.min(flow.index + 1, flow.total) / flow.total;
}
