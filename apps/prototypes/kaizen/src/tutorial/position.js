// Cálculo de geometría del recorrido (sin DOM): recorte resaltado y posición de la tarjeta.
export const CARD_MARGIN = 12;
export const CARD_GAP = 14;
export const SPOTLIGHT_PADDING = 6;
export const MIN_SIDE_WIDTH = 300;
const MIN_SIDE_VIEWPORT_HEIGHT = 600;

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

export function unionRects(rects) {
  const valid = rects.filter((rect) => rect && rect.width > 0 && rect.height > 0);
  if (!valid.length) return null;
  const left = Math.min(...valid.map((rect) => rect.left));
  const top = Math.min(...valid.map((rect) => rect.top));
  const right = Math.max(...valid.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...valid.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

// Ensancha el rectángulo y lo recorta a la pantalla.
export function padRect(rect, viewport, padding = SPOTLIGHT_PADDING) {
  const left = Math.max(0, rect.left - padding);
  const top = Math.max(0, rect.top - padding);
  const right = Math.min(viewport.width, rect.left + rect.width + padding);
  const bottom = Math.min(viewport.height, rect.top + rect.height + padding);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

export function isRectVisible(rect, viewport) {
  if (!rect || rect.width <= 0 || rect.height <= 0) return false;
  return rect.left < viewport.width && rect.top < viewport.height && rect.left + rect.width > 0 && rect.top + rect.height > 0;
}

// Colocación de la tarjeta junto al elemento resaltado y siempre dentro de la pantalla.
// Orden de preferencia: la indicada, la opuesta, luego las demás. Si ninguna cabe, se ancla
// abajo (o arriba, donde haya más sitio) sobre el elemento, dentro de los márgenes.
export function computeCardPosition({ target, card, viewport, margin = CARD_MARGIN, gap = CARD_GAP, prefer = 'bottom' }) {
  const width = Math.min(card.width, Math.max(0, viewport.width - margin * 2));
  const height = Math.min(card.height, Math.max(0, viewport.height - margin * 2));
  const maxLeft = viewport.width - margin - width;
  const maxTop = viewport.height - margin - height;

  if (!target || !isRectVisible(target, viewport)) {
    return { left: clamp((viewport.width - width) / 2, margin, maxLeft), top: clamp((viewport.height - height) / 2, margin, maxTop), width, height, placement: 'center' };
  }

  const centerX = target.left + target.width / 2;
  const centerY = target.top + target.height / 2;
  const spaces = {
    bottom: viewport.height - margin - (target.top + target.height + gap),
    top: target.top - gap - margin,
    right: viewport.width - margin - (target.left + target.width + gap),
    left: target.left - gap - margin,
  };
  const opposite = { bottom: 'top', top: 'bottom', left: 'right', right: 'left' };
  const first = spaces[prefer] === undefined ? 'bottom' : prefer;
  const order = [first, opposite[first], ...['bottom', 'top', 'right', 'left'].filter((side) => side !== first && side !== opposite[first])];

  for (const side of order) {
    if (side === 'bottom' || side === 'top') {
      if (spaces[side] < height) continue;
      return { left: clamp(centerX - width / 2, margin, maxLeft), top: side === 'bottom' ? target.top + target.height + gap : target.top - gap - height, width, height, placement: side };
    }
    // Junto a los lados la tarjeta puede estrecharse hasta MIN_SIDE_WIDTH (el alto real lo mide el componente).
    const room = spaces[side];
    const sideWidth = Math.min(width, room);
    if (sideWidth < Math.min(width, MIN_SIDE_WIDTH) || viewport.height < MIN_SIDE_VIEWPORT_HEIGHT || viewport.height - margin * 2 < height) continue;
    return { left: side === 'right' ? target.left + target.width + gap : target.left - gap - sideWidth, top: clamp(centerY - height / 2, margin, maxTop), width: sideWidth, height, placement: side };
  }

  // Sin sitio alrededor: se superpone junto al borde del elemento con más espacio libre (arriba o abajo).
  const useBottom = spaces.bottom >= spaces.top;
  return {
    left: clamp(centerX - width / 2, margin, maxLeft),
    top: useBottom ? clamp(target.top + target.height + gap, margin, maxTop) : clamp(target.top - gap - height, margin, maxTop),
    width,
    height,
    placement: 'overlay',
  };
}
