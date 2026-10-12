// Geometría de la tarjeta del tutorial (lógica pura). Los rectángulos son { top, left, width, height }
// en píxeles de la ventana.

const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));

// Rectángulo que contiene a todos los rectángulos dados (ignora los nulos).
export function unionRect(rects) {
  const list = rects.filter(Boolean);
  if (list.length === 0) return null;
  const top = Math.min(...list.map((r) => r.top));
  const left = Math.min(...list.map((r) => r.left));
  const bottom = Math.max(...list.map((r) => r.top + r.height));
  const right = Math.max(...list.map((r) => r.left + r.width));
  return { top, left, width: right - left, height: bottom - top };
}

// Agranda el rectángulo y lo recorta a la ventana.
export function padRect(r, pad, viewport) {
  const top = Math.max(0, r.top - pad);
  const left = Math.max(0, r.left - pad);
  const bottom = Math.min(viewport.height, r.top + r.height + pad);
  const right = Math.min(viewport.width, r.left + r.width + pad);
  return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

export function overlapArea(a, b) {
  const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const h = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

// Coloca la tarjeta junto al elemento resaltado, siempre dentro de la ventana. Prueba debajo, arriba,
// a la derecha, a la izquierda y, si el elemento es enorme, dentro de él (abajo o arriba); elige la
// que menos lo tapa. Sin elemento, la centra.
export function computeCardPosition({ target, card, viewport, margin = 12, gap = 14 }) {
  const cw = Math.min(card.width, Math.max(0, viewport.width - margin * 2));
  const ch = Math.min(card.height, Math.max(0, viewport.height - margin * 2));
  const fit = (left, top) => ({
    left: clamp(left, margin, viewport.width - margin - cw),
    top: clamp(top, margin, viewport.height - margin - ch),
  });
  if (!target) {
    const p = fit((viewport.width - cw) / 2, (viewport.height - ch) / 2);
    return { ...p, width: cw, height: ch, placement: 'center' };
  }
  const cx = target.left + target.width / 2 - cw / 2;
  const cy = target.top + target.height / 2 - ch / 2;
  const candidates = [
    ['bottom', fit(cx, target.top + target.height + gap)],
    ['top', fit(cx, target.top - gap - ch)],
    ['right', fit(target.left + target.width + gap, cy)],
    ['left', fit(target.left - gap - cw, cy)],
    ['inside-bottom', fit(cx, target.top + target.height - ch - gap)],
    ['inside-top', fit(cx, target.top + gap)],
  ];
  let best = null;
  for (const [placement, p] of candidates) {
    const overlap = overlapArea({ ...p, width: cw, height: ch }, target);
    if (best === null || overlap < best.overlap) best = { placement, overlap, ...p };
    if (overlap === 0) break;
  }
  return { left: best.left, top: best.top, width: cw, height: ch, placement: best.placement };
}

// ¿La tarjeta cae completa dentro de la ventana?
export function isInside(rect, viewport) {
  return rect.left >= 0 && rect.top >= 0 && rect.left + rect.width <= viewport.width && rect.top + rect.height <= viewport.height;
}

// Cuánto desplazar el área con scroll (positivo = hacia abajo) para que el elemento resaltado quede arriba y
// la tarjeta tenga sitio debajo. Devuelve null si elemento y tarjeta no caben juntos en la pantalla
// (entonces solo se asegura que el elemento esté a la vista).
export function scrollDeltaToReveal({ target, cardHeight, viewport, margin = 12, gap = 14, pad = 6 }) {
  if (!target) return null;
  const needed = target.height + pad * 2 + gap + cardHeight + margin * 2;
  if (needed > viewport.height) return null;
  return Math.round(target.top - pad - margin);
}

// ¿Ya se ve todo bien? El elemento está completo en pantalla y la tarjeta cabe a su lado sin taparlo.
// Si es así no hace falta desplazar nada.
export function isComfortable({ target, card, viewport, pad = 6 }) {
  if (!target) return true;
  const inView = target.top >= 0 && target.left >= 0 && target.top + target.height <= viewport.height && target.left + target.width <= viewport.width;
  if (!inView) return false;
  const spot = padRect(target, pad, viewport);
  const pos = computeCardPosition({ target: spot, card, viewport });
  return overlapArea(pos, spot) === 0;
}
