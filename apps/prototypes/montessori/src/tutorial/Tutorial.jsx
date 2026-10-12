import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './tutorial.css';
import { STEPS, availableSteps } from './steps.js';
import { createFlow, next, prev, isFirst, isLast, progressLabel, progressPercent } from './flow.js';
import { computeCardPosition, unionRect, padRect } from './position.js';
import { getStorage, writeTutorialStatus } from './persist.js';

const PAD = 6;

const isVisible = (el) => {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
};
const visibleTargets = (step) => (step.target ? [...document.querySelectorAll(`[data-tour="${step.target}"]`)].filter(isVisible) : []);
const toRect = (r) => ({ top: r.top, left: r.left, width: r.width, height: r.height });

// Rectángulo (en la ventana) que se resalta en un paso: el elemento, o la unión de varios.
function targetRect(step) {
  const els = visibleTargets(step);
  if (els.length === 0) return null;
  const used = step.union ? els : [els[0]];
  const rects = used.map((el) => toRect(el.getBoundingClientRect()));
  if (step.include) {
    for (const el of used) {
      const extra = el.querySelector(step.include);
      if (extra) rects.push(toRect(extra.getBoundingClientRect()));
    }
  }
  return unionRect(rects);
}

const viewportSize = () => ({ width: document.documentElement.clientWidth || window.innerWidth, height: window.innerHeight });

// Recorrido guiado: oscurece la pantalla, resalta el elemento del paso y muestra la tarjeta
// junto a él. Es un diálogo modal (foco atrapado, Escape cierra, el foco vuelve a donde estaba).
// tools = { open, set }: abre el menú de herramientas en el paso que lo pide y lo deja como estaba.
export default function Tutorial({ onClose, tools }) {
  // Los pasos se calculan al montar, cuando la interfaz ya está en el DOM.
  const [steps, setSteps] = useState([]);
  const [flow, setFlow] = useState(() => createFlow(0));
  const [ready, setReady] = useState(false);
  const [layout, setLayout] = useState({ spot: null, pos: null });
  const cardRef = useRef(null);
  const toolsRef = useRef(tools);
  toolsRef.current = tools;
  const initialTools = useRef(tools.open);
  const closedRef = useRef(false);
  const step = ready ? steps[Math.min(flow.index, steps.length - 1)] : undefined;

  useLayoutEffect(() => {
    const list = availableSteps(STEPS, (st) => visibleTargets(st).length > 0);
    setSteps(list);
    setFlow(createFlow(list.length));
    setReady(true);
  }, []);

  const close = useCallback((status) => {
    if (closedRef.current) return;
    closedRef.current = true;
    writeTutorialStatus(getStorage(), status);
    onClose();
  }, [onClose]);

  // Cálculo de la posición del recuadro resaltado y de la tarjeta.
  const measure = useCallback(() => {
    if (!step || !cardRef.current) return;
    const viewport = viewportSize();
    const raw = targetRect(step);
    const spot = raw ? padRect(raw, PAD, viewport) : null;
    const card = { width: cardRef.current.offsetWidth, height: cardRef.current.offsetHeight };
    const pos = computeCardPosition({ target: spot, card, viewport });
    setLayout((old) => {
      const same = old.pos && old.pos.left === pos.left && old.pos.top === pos.top && JSON.stringify(old.spot) === JSON.stringify(spot);
      return same ? old : { spot, pos };
    });
  }, [step]);

  // Foco inicial dentro del diálogo y devolución del foco al cerrar.
  useEffect(() => {
    const opener = document.activeElement;
    return () => {
      if (opener && opener !== document.body && opener.isConnected) opener.focus?.();
    };
  }, []);

  useEffect(() => {
    if (ready) cardRef.current?.querySelector('[data-autofocus]')?.focus();
  }, [ready]);

  // Al cerrar, el menú de herramientas vuelve a como estaba.
  useEffect(() => () => toolsRef.current.set(initialTools.current), []);

  // Cada paso: estado de la interfaz, elemento a la vista y medición (también tras las transiciones).
  useLayoutEffect(() => {
    if (!step) return undefined;
    const wide = window.matchMedia('(min-width: 761px)').matches;
    toolsRef.current.set(step.tools === 'open' && wide ? true : initialTools.current);
    const els = visibleTargets(step);
    const first = els[0];
    if (first) first.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    if (step.target === 'item' && first) first.setAttribute('data-tour-peek', '');
    measure();
    const raf = requestAnimationFrame(measure);
    const t = setTimeout(measure, 320);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    els.forEach((el) => ro?.observe(el));
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      ro?.disconnect();
      first?.removeAttribute('data-tour-peek');
    };
  }, [step, measure]);

  // Recalcular al cambiar tamaño, scroll u orientación.
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    window.addEventListener('scroll', on, true);
    window.visualViewport?.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
      window.removeEventListener('scroll', on, true);
      window.visualViewport?.removeEventListener('resize', on);
    };
  }, [measure]);

  // Terminó el último paso.
  useEffect(() => {
    if (ready && (flow.finished || steps.length === 0)) close('done');
  }, [ready, flow.finished, steps.length, close]);

  const go = (fn) => setFlow((f) => fn(f));

  // Teclado: Escape cierra, Tab queda dentro de la tarjeta, flechas ← → cambian de paso.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close('skipped');
      } else if (e.key === 'Tab') {
        const f = [...(cardRef.current?.querySelectorAll('button:not(:disabled)') ?? [])];
        if (f.length === 0) return;
        const i = f.indexOf(document.activeElement);
        if (i === -1) { e.preventDefault(); f[0].focus(); }
        else if (e.shiftKey && i === 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        go(e.key === 'ArrowRight' ? next : prev);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [close]);

  if (!step) return null;
  const { spot, pos } = layout;
  const last = isLast(flow);

  return createPortal(
    <div className="tour" data-testid="tour">
      {spot ? (
        <div className="tour-spot" aria-hidden="true" style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }} />
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
        data-placement={pos?.placement}
        style={pos ? { top: pos.top, left: pos.left, maxWidth: pos.width } : { opacity: 0 }}
      >
        <div className="tour-head">
          <span className="tour-count" data-testid="tour-progress">{progressLabel(flow)}</span>
          <button type="button" className="btn ghost subtle" onClick={() => close('skipped')}>
            Saltar tutorial
          </button>
        </div>
        <div className="meter" role="progressbar" aria-label="Avance del tutorial" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent(flow)}>
          <span style={{ width: `${progressPercent(flow)}%` }} />
        </div>
        <div className="tour-body" aria-live="polite" aria-atomic="true">
          <h2 id="tour-title"><span className="dlg-icon" aria-hidden="true">{step.icon}</span>{step.title}</h2>
          <p id="tour-text" className="tool-hint">{step.text}</p>
        </div>
        <footer>
          <button type="button" className="btn ghost" disabled={isFirst(flow)} onClick={() => go(prev)}>
            Anterior
          </button>
          <button type="button" className="btn primary" data-autofocus onClick={() => go(next)}>
            {last ? 'Terminar' : 'Siguiente'}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
