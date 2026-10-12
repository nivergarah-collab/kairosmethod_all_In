import { describe, expect, it } from 'vitest';
import {
  TUTORIAL_KEY,
  clampIndex,
  clipToViewport,
  computeCardPosition,
  isFirst,
  isLast,
  markSeen,
  nextIndex,
  prevIndex,
  progressLabel,
  scrollDelta,
  shouldAutoOpen,
  type Rect,
  type TutorialStorage,
} from '../src/tutorial/engine';
import { TOUR_STEPS } from '../src/tutorial/steps';
import { buildDemoState } from '../src/tutorial/demo';
import { STORAGE_KEY } from '../src/lib/storage';
import { dueCards, phaseCounts } from '../src/state/selectors';

function makeStorage(init: Record<string, string> = {}): TutorialStorage & { map: Map<string, string> } {
  const map = new Map(Object.entries(init));
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, String(v)),
  };
}

const blocked: TutorialStorage = {
  getItem() {
    throw new Error('bloqueado');
  },
  setItem() {
    throw new Error('bloqueado');
  },
};

describe('pasos del tutorial', () => {
  it('tienen id y destino únicos y textos en español', () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    const targets = TOUR_STEPS.map((s) => s.target);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(targets).size).toBe(targets.length);
    for (const s of TOUR_STEPS) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.text.length).toBeGreaterThan(0);
    }
  });

  it('cubren las funciones básicas del método', () => {
    const targets = TOUR_STEPS.map((s) => s.target);
    for (const t of ['card-form', 'ribbons', 'book', 'stamps', 'agenda', 'catalog', 'notepad', 'actions']) {
      expect(targets).toContain(t);
    }
  });

  it('solo el paso de los sellos abre la respuesta', () => {
    expect(TOUR_STEPS.filter((s) => s.reveal).map((s) => s.id)).toEqual(['stamps']);
  });
});

describe('avance y retroceso', () => {
  it('no se sale del rango', () => {
    expect(nextIndex(0, 5)).toBe(1);
    expect(nextIndex(4, 5)).toBe(4);
    expect(prevIndex(0, 5)).toBe(0);
    expect(prevIndex(3, 5)).toBe(2);
    expect(clampIndex(NaN, 5)).toBe(0);
    expect(clampIndex(9, 0)).toBe(0);
  });

  it('detecta primero y último paso', () => {
    expect(isFirst(0)).toBe(true);
    expect(isFirst(1)).toBe(false);
    expect(isLast(4, 5)).toBe(true);
    expect(isLast(3, 5)).toBe(false);
  });

  it('formatea el progreso', () => {
    expect(progressLabel(1, 7)).toBe('Paso 2 de 7');
    expect(progressLabel(99, 7)).toBe('Paso 7 de 7');
  });
});

describe('persistencia del tutorial', () => {
  it('usa su propia clave, distinta de la de datos', () => {
    expect(TUTORIAL_KEY).toBe('kairos_spaced_tutorial_v1');
    expect(TUTORIAL_KEY).not.toBe(STORAGE_KEY);
  });

  it('se abre solo la primera vez y no vuelve tras marcarlo', () => {
    const st = makeStorage();
    expect(shouldAutoOpen(st)).toBe(true);
    expect(markSeen(st)).toBe(true);
    expect(shouldAutoOpen(st)).toBe(false);
    expect([...st.map.keys()]).toEqual([TUTORIAL_KEY]);
  });

  it('no falla con almacenamiento bloqueado o ausente', () => {
    expect(shouldAutoOpen(blocked)).toBe(true);
    expect(markSeen(blocked)).toBe(false);
    expect(shouldAutoOpen(null)).toBe(true);
    expect(markSeen(null)).toBe(false);
  });
});

describe('posición de la tarjeta', () => {
  const vp = { width: 390, height: 844 };
  const card = { width: 360, height: 220 };

  function inside(p: { top: number; left: number }, c = card, v = vp) {
    expect(p.top).toBeGreaterThanOrEqual(0);
    expect(p.left).toBeGreaterThanOrEqual(0);
    expect(p.top + c.height).toBeLessThanOrEqual(v.height);
    expect(p.left + c.width).toBeLessThanOrEqual(v.width);
  }

  it('va debajo si hay espacio', () => {
    const t: Rect = { top: 40, left: 20, width: 200, height: 60 };
    const p = computeCardPosition(t, card, vp);
    expect(p.placement).toBe('bottom');
    expect(p.top).toBeGreaterThanOrEqual(t.top + t.height);
    inside(p);
  });

  it('va arriba si abajo no cabe', () => {
    const t: Rect = { top: 700, left: 20, width: 200, height: 100 };
    const p = computeCardPosition(t, card, vp);
    expect(p.placement).toBe('top');
    expect(p.top + card.height).toBeLessThanOrEqual(t.top);
    inside(p);
  });

  it('en PC usa un costado cuando no cabe arriba ni abajo', () => {
    const big = { width: 1440, height: 400 };
    const t: Rect = { top: 20, left: 20, width: 600, height: 360 };
    const p = computeCardPosition(t, { width: 380, height: 260 }, big);
    expect(p.placement).toBe('right');
    inside(p, { width: 380, height: 260 }, big);
  });

  it('si el elemento ocupa toda la pantalla, se queda dentro (over)', () => {
    const t: Rect = { top: 0, left: 0, width: 390, height: 844 };
    const p = computeCardPosition(t, card, vp);
    expect(p.placement).toBe('over');
    inside(p);
  });

  it('centra sin elemento y siempre queda dentro del viewport', () => {
    const p = computeCardPosition(null, card, vp);
    expect(p.placement).toBe('center');
    inside(p);
    for (const w of [320, 360, 390, 844, 1440]) {
      for (const h of [390, 800, 900]) {
        const v = { width: w, height: h };
        const c = { width: Math.min(380, w - 24), height: 240 };
        for (const t of [
          { top: -50, left: -30, width: 80, height: 50 },
          { top: h - 20, left: w - 20, width: 100, height: 100 },
          { top: 100, left: 10, width: w - 20, height: 400 },
        ]) {
          inside(computeCardPosition(clipToViewport(t, v), c, v), c, v);
        }
      }
    }
  });
});

describe('recorte y scroll', () => {
  it('recorta el rectángulo al viewport', () => {
    expect(clipToViewport({ top: -20, left: -10, width: 100, height: 100 }, { width: 50, height: 60 })).toEqual({
      top: 0,
      left: 0,
      width: 50,
      height: 60,
    });
  });

  it('calcula el desplazamiento para que elemento y tarjeta quepan juntos', () => {
    const vp = { width: 390, height: 844 };
    const d = scrollDelta({ top: 0, left: 0, width: 300, height: 300 }, 220, vp);
    // bloque = 300 + 14 + 220 = 534; margen superior = (844 - 534) / 2 = 155
    expect(d).toBeCloseTo(-155);
    // elemento más alto que la pantalla: queda pegado arriba con margen
    expect(scrollDelta({ top: 500, left: 0, width: 300, height: 2000 }, 220, vp)).toBe(488);
  });
});

describe('fichas de ejemplo', () => {
  const today = '2026-10-12';
  const demo = buildDemoState(today, true);

  it('generan fichas de las cuatro fases y alguna pendiente hoy', () => {
    expect(dueCards(demo).length).toBeGreaterThan(0);
    const c = phaseCounts(demo);
    expect(c.new + c.learning + c.reviewing + c.mastered).toBe(demo.cards.length);
    expect(Object.values(c).every((n) => n > 0)).toBe(true);
  });

  it('usan ids propios y no tocan el almacenamiento de datos', () => {
    expect(demo.cards.every((c) => c.id.startsWith('tour-demo-'))).toBe(true);
    const st = makeStorage();
    markSeen(st);
    expect(st.map.has(STORAGE_KEY)).toBe(false);
  });
});
