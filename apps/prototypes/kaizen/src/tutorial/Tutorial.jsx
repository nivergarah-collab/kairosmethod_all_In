import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TUTORIAL_STEPS, sceneSignature } from './steps.js';
import { isFirstStep, isLastStep, nextIndex, previousIndex, progressLabel } from './flow.js';
import { computeCardPosition, isRectVisible, padRect, unionRects } from './position.js';
import './tutorial.css';

// Esperas con temporizadores (no con requestAnimationFrame): siguen avanzando aunque la pestaña no pinte fotogramas.
const frames = (count) => new Promise((resolve) => window.setTimeout(resolve, 20 * Math.max(1, count)));

async function waitFor(selector, timeout = 1500) {
  const start = performance.now();
  while (performance.now() - start < timeout) {
    const found = document.querySelector(selector);
    if (found) return found;
    await frames(1);
  }
  return null;
}

const CARD_WIDTH = 360;
const readViewport = () => ({ width: window.innerWidth, height: window.innerHeight });
const toRect = (box) => ({ left: box.left, top: box.top, width: box.width, height: box.height });
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function collectTargets(selectors, viewport) {
  const elements = (selectors ?? []).flatMap((selector) => [...document.querySelectorAll(selector)]);
  return { elements, rects: elements.map((element) => toRect(element.getBoundingClientRect())).filter((rect) => isRectVisible(rect, viewport)) };
}

// Pone en el estado pedido las partes internas de la escena que no son props de App (se hace con clics reales, sin tocar su lógica).
async function applySceneControls(scene) {
  if (scene.view !== 'garden') return;
  if (scene.garden === 'plants' && scene.select) {
    const plant = await waitFor('[data-tour="plant"]');
    plant?.click();
  } else {
    await waitFor('[data-tour="scene"]');
  }
  if (scene.details) {
    const button = document.querySelector('[data-tour="scene-controls"] button[aria-pressed="false"]');
    button?.click();
  }
  if (scene.demo) {
    const toggle = document.querySelector('[data-tour="demo-toggle"][aria-expanded="false"]');
    toggle?.click();
    await waitFor('[data-tour="demo-panel"]');
  }
  await frames(2);
}

// Si el elemento resaltado no cabe en pantalla, lo acerca con scroll.
function revealTarget(selectors) {
  const [main] = collectTargets(selectors, readViewport()).elements;
  if (!main) return;
  const box = main.getBoundingClientRect();
  const vh = window.innerHeight;
  if (box.top < 0 || box.bottom > vh) main.scrollIntoView({ block: box.height > vh ? 'start' : 'center', inline: 'nearest', behavior: 'instant' });
}

export function Tutorial({ steps = TUTORIAL_STEPS, controller, onClose }) {
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [viewport, setViewport] = useState(readViewport);
  const [rects, setRects] = useState([]);
  const [cardHeight, setCardHeight] = useState(240);
  const cardRef = useRef(null);
  const nextRef = useRef(null);
  const lastScene = useRef(null);
  const openerRef = useRef(null);
  const closedRef = useRef(false);
  const readyRef = useRef(false);
  readyRef.current = ready;
  const step = steps[index];
  const total = steps.length;
  const last = isLastStep(index, total);
  const first = isFirstStep(index);
  const reducedMotion = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, []);

  const close = useCallback((status) => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose(status);
  }, [onClose]);
  const goNext = () => (last ? close('done') : setIndex((value) => nextIndex(value, total)));
  const goPrevious = () => setIndex((value) => previousIndex(value, total));

  const focusCard = useCallback(() => {
    const card = cardRef.current;
    if (card && !card.contains(document.activeElement)) (nextRef.current ?? card).focus({ preventScroll: true });
  }, []);

  // El resto de la app queda inerte (sin foco ni clics) mientras el recorrido está abierto.
  useEffect(() => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    return () => {
      root?.removeAttribute('inert');
      const opener = openerRef.current;
      const restore = () => {
        const target = opener && opener !== document.body && document.contains(opener) ? opener : document.querySelector('[data-tour="help"]');
        target?.focus?.({ preventScroll: true });
      };
      restore();
      requestAnimationFrame(restore);
    };
  }, []);

  // Recalcula el recorte con el tamaño, el scroll y la orientación.
  const measure = useCallback(() => {
    const nextViewport = readViewport();
    setViewport((current) => (current.width === nextViewport.width && current.height === nextViewport.height ? current : nextViewport));
    const { rects: found } = collectTargets(step.target, nextViewport);
    const padded = found.map((rect) => padRect(rect, nextViewport));
    setRects((current) => (JSON.stringify(current) === JSON.stringify(padded) ? current : padded));
  }, [step]);

  // Entrada a cada paso: deja la escena en el estado pedido, muestra el elemento y mueve el foco.
  useEffect(() => {
    let cancelled = false;
    const enterStep = async () => {
      const { scene } = step;
      controller.setView(scene.view);
      controller.setVariant(scene.garden);
      controller.setDetail(scene.detail);
      const signature = `${scene.view}|${sceneSignature(step)}`;
      if (lastScene.current !== signature) controller.resetScene();
      lastScene.current = signature;
      await frames(3);
      if (cancelled) return;
      await applySceneControls(scene);
      if (cancelled) return;
      if (step.target) await waitFor(step.target[0]);
      if (cancelled) return;
      revealTarget(step.target);
      await frames(2);
      if (!cancelled) measure();
    };
    setReady(false);
    // Si algo del paso falla, la tarjeta igualmente se muestra (centrada) para no bloquear a la persona.
    enterStep().catch(() => {}).then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [index, step, controller, measure]);

  useEffect(() => {
    if (ready) focusCard();
  }, [ready, index, focusCard]);

  useEffect(() => {
    const onChange = () => measure();
    const onResize = () => { if (readyRef.current) revealTarget(step.target); measure(); };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('scroll', onChange, true);
    const timer = window.setInterval(onChange, 250);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('scroll', onChange, true);
      window.clearInterval(timer);
    };
  }, [measure, step]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;
    const update = () => setCardHeight((current) => (current === card.offsetHeight ? current : card.offsetHeight));
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(card);
    return () => observer.disconnect();
  }, [index, viewport]);

  // Teclado: Escape cierra, flechas navegan y Tab queda atrapado dentro de la tarjeta.
  useEffect(() => {
    const onKeyDown = (event) => {
      const card = cardRef.current;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close('skipped');
      } else if (event.key === 'ArrowRight' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (!last) setIndex((value) => nextIndex(value, total));
      } else if (event.key === 'ArrowLeft' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setIndex((value) => previousIndex(value, total));
      } else if (event.key === 'Tab' && card) {
        const items = [...card.querySelectorAll(FOCUSABLE)];
        if (!items.length) { event.preventDefault(); return; }
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        if (!card.contains(document.activeElement)) { event.preventDefault(); firstItem.focus(); }
        else if (event.shiftKey && document.activeElement === firstItem) { event.preventDefault(); lastItem.focus(); }
        else if (!event.shiftKey && document.activeElement === lastItem) { event.preventDefault(); firstItem.focus(); }
      }
    };
    const onFocusIn = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) focusCard();
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [close, focusCard, last, total]);

  const targetBox = useMemo(() => unionRects(rects), [rects]);
  const position = computeCardPosition({ target: targetBox, card: { width: CARD_WIDTH, height: cardHeight }, viewport, prefer: step.prefer });
  const titleId = 'tour-title';
  const bodyId = 'tour-body';

  return createPortal(
    <div className={`tour-root ${reducedMotion ? 'is-reduced' : ''}`} data-ready={ready ? 'true' : 'false'}>
      <div className="tour-blocker" aria-hidden="true" />
      <svg className="tour-spotlight" width={viewport.width} height={viewport.height} viewBox={`0 0 ${viewport.width} ${viewport.height}`} aria-hidden="true" focusable="false">
        <defs>
          <mask id="tour-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={viewport.width} height={viewport.height}>
            <rect x="0" y="0" width={viewport.width} height={viewport.height} fill="#fff" />
            {rects.map((rect, i) => <rect key={i} x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx="14" fill="#000" />)}
          </mask>
        </defs>
        <rect className="tour-dim" x="0" y="0" width={viewport.width} height={viewport.height} mask="url(#tour-mask)" />
        {rects.map((rect, i) => <rect key={i} className="tour-ring" data-tour-ring x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx="14" />)}
      </svg>
      <section
        ref={cardRef}
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        data-placement={position.placement}
        style={{ left: position.left, top: position.top, width: position.width, maxHeight: Math.max(0, viewport.height - 24) }}
      >
        <p className="tour-progress">
          <span>{progressLabel(index, total)}</span>
          <span className="tour-dots" aria-hidden="true">{steps.map((item, i) => <i key={item.id} className={i === index ? 'is-current' : i < index ? 'is-done' : ''} />)}</span>
        </p>
        <h2 id={titleId}>{step.title}</h2>
        <p id={bodyId} className="tour-body">{step.body}</p>
        <div className="tour-actions">
          <button type="button" className="tour-skip" onClick={() => close('skipped')}>Saltar tutorial</button>
          <span className="tour-nav">
            <button type="button" className="tour-button" disabled={first} onClick={goPrevious}>Anterior</button>
            <button type="button" className="tour-button tour-primary" ref={nextRef} onClick={goNext}>{last ? 'Terminar' : 'Siguiente'}</button>
          </span>
        </div>
      </section>
      <p className="tour-sr" role="status" aria-live="polite">{ready ? `${progressLabel(index, total)}. ${step.title}` : ''}</p>
    </div>,
    document.body,
  );
}
