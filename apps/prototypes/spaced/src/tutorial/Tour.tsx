import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './tutorial.css';
import { TOUR_STEPS } from './steps';
import {
  clipToViewport,
  computeCardPosition,
  isFirst,
  isLast,
  nextIndex,
  prevIndex,
  progressLabel,
  scrollDelta,
  type CardPosition,
  type Rect,
  type Size,
} from './engine';

interface Props {
  index: number;
  onIndexChange: (index: number) => void;
  /** Cierra el tutorial (terminado, saltado o con Escape). */
  onClose: () => void;
}

const PAD = 6;

function viewport(): Size {
  return { width: document.documentElement.clientWidth, height: window.innerHeight };
}

function findTarget(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${id}"]`);
}

export function Tour({ index, onIndexChange, onClose }: Props) {
  const total = TOUR_STEPS.length;
  const step = TOUR_STEPS[index];
  const cardRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const [spot, setSpot] = useState<Rect | null>(null);
  const [pos, setPos] = useState<CardPosition | null>(null);

  // Última versión de las funciones para los listeners globales.
  const api = useRef({ index, onIndexChange, onClose });
  api.current = { index, onIndexChange, onClose };

  const measure = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    const vp = viewport();
    const el = findTarget(TOUR_STEPS[api.current.index].target);
    const box = el ? el.getBoundingClientRect() : null;
    const size = { width: card.offsetWidth, height: card.offsetHeight };
    if (!box || (box.width === 0 && box.height === 0)) {
      setSpot(null);
      setPos(computeCardPosition(null, size, vp));
      return;
    }
    const visible = clipToViewport(
      { top: box.top, left: box.left, width: box.width, height: box.height },
      vp
    );
    const padded = clipToViewport(
      {
        top: visible.top - PAD,
        left: visible.left - PAD,
        width: visible.width + PAD * 2,
        height: visible.height + PAD * 2,
      },
      vp
    );
    setSpot(padded);
    setPos(computeCardPosition(visible, size, vp));
  }, []);

  // Apertura: recuerda quién abrió y aísla el resto de la página.
  useLayoutEffect(() => {
    closing.current = false;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    return () => {
      closing.current = true;
      root?.removeAttribute('inert');
      const opener = openerRef.current;
      const back = opener && opener !== document.body && opener.isConnected
        ? opener
        : findTarget('help');
      back?.focus({ preventScroll: true });
    };
  }, []);

  // Cada paso: lleva el elemento a la pantalla, mide y mueve el foco a la tarjeta.
  useLayoutEffect(() => {
    const card = cardRef.current;
    const el = findTarget(step.target);
    if (el && card) {
      el.scrollIntoView({ block: 'start', inline: 'nearest' });
      const delta = scrollDelta(el.getBoundingClientRect(), card.offsetHeight, viewport());
      if (Math.abs(delta) > 1) window.scrollBy(0, delta);
    }
    measure();
    card?.focus({ preventScroll: true });
  }, [index, step.target, measure]);

  // Recalcula con tamaño, scroll, orientación y cambios de tamaño del elemento.
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.addEventListener('scroll', schedule, true);
    const observer = new ResizeObserver(schedule);
    const el = findTarget(step.target);
    if (el) observer.observe(el);
    if (cardRef.current) observer.observe(cardRef.current);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.removeEventListener('scroll', schedule, true);
      observer.disconnect();
    };
  }, [measure, step.target]);

  // Teclado: Escape, flechas y trampa de foco.
  useEffect(() => {
    function focusables(): HTMLElement[] {
      const card = cardRef.current;
      if (!card) return [];
      return Array.from(card.querySelectorAll<HTMLElement>('button:not([disabled])'));
    }
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const { index: i, onIndexChange: change, onClose: close } = api.current;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowRight' && !isLast(i, total)) {
        e.preventDefault();
        change(nextIndex(i, total));
      } else if (e.key === 'ArrowLeft' && !isFirst(i)) {
        e.preventDefault();
        change(prevIndex(i, total));
      } else if (e.key === 'Tab') {
        const items = focusables();
        const card = cardRef.current;
        if (!card || items.length === 0) {
          e.preventDefault();
          card?.focus();
          return;
        }
        const active = document.activeElement;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (active === first || active === card || !card.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !card.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    function onFocusIn(e: FocusEvent) {
      const card = cardRef.current;
      if (closing.current) return;
      if (card && e.target instanceof Node && !card.contains(e.target)) card.focus({ preventScroll: true });
    }
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [total]);

  const last = isLast(index, total);

  return createPortal(
    <div className="tour-root">
      <div className="tour-blocker" aria-hidden="true" />
      {spot ? (
        <div
          className="tour-spot"
          aria-hidden="true"
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
        />
      ) : (
        <div className="tour-dim" aria-hidden="true" />
      )}
      <div
        ref={cardRef}
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        tabIndex={-1}
        data-placement={pos?.placement}
        style={{
          top: pos?.top ?? 0,
          left: pos?.left ?? 0,
          opacity: pos ? undefined : 0,
        }}
      >
        <div className="tour-meta">
          <span className="tour-progress">{progressLabel(index, total)}</span>
          <span className="tour-badge">Fichas de ejemplo</span>
        </div>
        <h2 id="tour-title" className="tour-title">{step.title}</h2>
        <p id="tour-text" className="tour-text">{step.text}</p>
        <div className="tour-actions">
          <button type="button" className="tour-skip" onClick={onClose}>
            Saltar tutorial
          </button>
          <div className="tour-nav">
            <button
              type="button"
              className="btn-soft tour-btn"
              disabled={isFirst(index)}
              onClick={() => onIndexChange(prevIndex(index, total))}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn-file tour-btn tour-next"
              onClick={() => (last ? onClose() : onIndexChange(nextIndex(index, total)))}
            >
              {last ? 'Terminar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
