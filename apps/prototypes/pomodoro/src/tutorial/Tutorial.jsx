// Recorrido guiado de PomoStudy: oscurece la pantalla, resalta la parte que se explica y muestra una
// tarjeta junto a ella. Cambia de pestaña por la persona usuaria y, si hace falta mostrar el temporizador
// sin que haya una sesión, usa una de muestra que vive solo en memoria y se descarta al terminar.
// Es un diálogo modal: foco atrapado, Escape cierra y el foco vuelve a donde estaba.
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './tutorial.css';
import { useVM } from '../useStore.jsx';
import { Button, OutlinedButton, TextButton, LinearProgressIndicator, T } from '../m3.jsx';
import { STEPS } from './steps.js';
import { createFlow, next, prev, isFirst, isLast, progressLabel, progressFraction } from './flow.js';
import { computeCardPosition, unionRect, padRect, scrollDeltaToReveal, isComfortable } from './position.js';
import { planView, planExit } from './plan.js';
import { getStorage, writeTutorialStatus } from './persist.js';

const PAD = 6;
const MEASURE_DELAYS = [0, 60, 180, 400];

const isVisible = (el) => {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
};
const visibleTargets = (step) => (step.target ? [...document.querySelectorAll(`[data-tour="${step.target}"]`)].filter(isVisible) : []);
const toRect = (r) => ({ top: r.top, left: r.left, width: r.width, height: r.height });
// Primer ancestro con scroll vertical (el área de la pantalla actual).
const scrollParent = (el) => {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
};
const viewportSize = () => ({ width: document.documentElement.clientWidth || window.innerWidth, height: window.innerHeight });

export default function Tutorial({ onClose }) {
  const { state, vm } = useVM();
  const [flow, setFlow] = useState(() => createFlow(STEPS.length));
  const [layout, setLayout] = useState({ spot: null, pos: null });
  const cardRef = useRef(null);
  const closedRef = useRef(false);
  const demoRef = useRef(false); // ¿el tutorial inició una sesión de muestra?
  const demoSessionIdRef = useRef(null);
  const initialTab = useRef(state.currentTab);
  const stateRef = useRef(state);
  stateRef.current = state;
  const scrolledFor = useRef(null);
  const step = STEPS[Math.min(flow.index, STEPS.length - 1)];

  // Inicia una sesión de muestra sin sonido ni vibración (se restauran de inmediato) y la deja en pausa.
  const startDemo = useCallback(() => {
    const { soundAlertsEnabled, vibrationAlertsEnabled } = vm.getState();
    vm.setSoundAlerts(false);
    vm.setVibrationAlerts(false);
    demoSessionIdRef.current = vm.startSession();
    vm.pauseTimer();
    vm.setSoundAlerts(soundAlertsEnabled);
    vm.setVibrationAlerts(vibrationAlertsEnabled);
    demoRef.current = true;
  }, [vm]);

  const stopDemo = useCallback(() => {
    if (!demoRef.current) return;
    demoRef.current = false;
    const demoSessionId = demoSessionIdRef.current;
    demoSessionIdRef.current = null;
    if (demoSessionId !== null) vm.cancelSessionIfCurrent(demoSessionId);
  }, [vm]);

  // Deja la app como estaba: sin sesión de muestra y en la pestaña en que se abrió el tutorial.
  const restoreApp = useCallback(() => {
    const s = vm.getState();
    const plan = planExit({ demoStarted: demoRef.current, initialTab: initialTab.current, tab: s.currentTab });
    if (plan.stopDemo) stopDemo();
    if (plan.setTab !== null) vm.setTab(plan.setTab);
  }, [vm, stopDemo]);

  const close = useCallback((status) => {
    if (closedRef.current) return;
    closedRef.current = true;
    writeTutorialStatus(getStorage(), status);
    restoreApp();
    onClose();
  }, [onClose, restoreApp]);

  // Mientras el tutorial está abierto, el resto de la app no recibe foco ni clics.
  useLayoutEffect(() => {
    const opener = document.activeElement;
    const root = document.getElementById('root');
    if (root) {
      root.inert = true;
      root.dataset.tour = 'open';
    }
    return () => {
      if (root) {
        root.inert = false;
        delete root.dataset.tour;
      }
      if (opener && opener !== document.body && opener.isConnected) opener.focus?.();
    };
  }, []);

  useEffect(() => {
    cardRef.current?.querySelector('[data-testid="tour-next"]')?.focus();
  }, []);

  // Si el componente se desmonta sin pasar por close (p. ej. recarga controlada), no deja nada a medias.
  useEffect(() => () => {
    if (!closedRef.current) restoreApp();
  }, [restoreApp]);

  // Posición del recuadro resaltado y de la tarjeta.
  const measure = useCallback(() => {
    if (!cardRef.current) return;
    const viewport = viewportSize();
    const els = visibleTargets(step);
    const raw = els.length ? unionRect(els.map((el) => toRect(el.getBoundingClientRect()))) : null;
    const spot = raw ? padRect(raw, PAD, viewport) : null;
    const card = { width: cardRef.current.offsetWidth, height: cardRef.current.offsetHeight };
    const pos = computeCardPosition({ target: spot, card, viewport });
    setLayout((old) => {
      const same = old.pos && old.pos.left === pos.left && old.pos.top === pos.top && JSON.stringify(old.spot) === JSON.stringify(spot);
      return same ? old : { spot, pos };
    });
  }, [step]);

  // Lleva lo resaltado a un sitio donde quepan él y la tarjeta; si ya se ve bien, no mueve nada.
  const reveal = useCallback(() => {
    const els = visibleTargets(step);
    if (els.length === 0) return;
    const target = unionRect(els.map((el) => toRect(el.getBoundingClientRect())));
    const viewport = viewportSize();
    const card = { width: cardRef.current?.offsetWidth ?? 360, height: cardRef.current?.offsetHeight ?? 240 };
    if (isComfortable({ target, card, viewport })) return;
    const delta = scrollDeltaToReveal({ target, cardHeight: card.height, viewport });
    const scroller = delta === null ? null : scrollParent(els[0]);
    if (scroller) scroller.scrollTop += delta;
    else els[0].scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [step]);

  // Cada paso: se cambia la pestaña (y la sesión de muestra) si hace falta, se lleva el elemento a la vista y se mide
  // varias veces, porque la interfaz tarda un instante en pintar la pestaña nueva.
  useLayoutEffect(() => {
    const s = stateRef.current;
    const plan = planView({ step, sessionActive: s.isSessionActive, demoStarted: demoRef.current, tab: s.currentTab });
    if (plan.stopDemo) stopDemo();
    if (plan.startDemo) startDemo();
    if (plan.setTab !== null) vm.setTab(plan.setTab);
    scrolledFor.current = null;
    const attempt = () => {
      if (scrolledFor.current !== step.id && visibleTargets(step).length) {
        scrolledFor.current = step.id;
        reveal();
      }
      measure();
    };
    attempt();
    const timers = MEASURE_DELAYS.slice(1).map((ms) => setTimeout(attempt, ms));
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    visibleTargets(step).forEach((el) => ro?.observe(el));
    return () => {
      timers.forEach(clearTimeout);
      ro?.disconnect();
    };
  }, [step, measure, reveal, vm, startDemo, stopDemo]);

  // Al cambiar el tamaño u orientación se vuelve a acomodar y a medir. El scroll solo vuelve a medir.
  useEffect(() => {
    let timer = 0;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        reveal();
        measure();
      }, 60);
    };
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 16);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('scroll', onScroll, true);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('scroll', onScroll, true);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, [measure, reveal]);

  // Terminó el último paso.
  useEffect(() => {
    if (flow.finished) close('done');
  }, [flow.finished, close]);

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
        if (i === -1) {
          e.preventDefault();
          f[0].focus();
        } else if (e.shiftKey && i === 0) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault();
          f[0].focus();
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        setFlow((f) => (e.key === 'ArrowRight' ? next(f) : prev(f)));
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [close]);

  const { spot, pos } = layout;
  const last = isLast(flow);
  const pct = Math.round(progressFraction(flow) * 100);

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
          <T v="labelMedium" w="bold" color="var(--pomo-primary)" className="tour-count" as="span"><span data-testid="tour-progress">{progressLabel(flow)}</span></T>
          <TextButton testId="tour-skip" onClick={() => close('skipped')} className="tour-skip">Saltar tutorial</TextButton>
        </div>
        <div role="progressbar" aria-label="Avance del tutorial" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <LinearProgressIndicator progress={progressFraction(flow)} color="var(--pomo-primary)" trackColor="var(--primary-container)" height={4} radius={2} />
        </div>
        <div className="tour-body" aria-live="polite" aria-atomic="true">
          <h2 id="tour-title" className="tour-title t-titleLarge w-bold">
            <span className="tour-icon" aria-hidden="true">{step.icon}</span>
            {step.title}
          </h2>
          <p id="tour-text" className="tour-text t-bodyMedium">{step.text}</p>
        </div>
        <div className="tour-actions">
          <OutlinedButton testId="tour-prev" onClick={() => setFlow(prev)} disabled={isFirst(flow)} radius={14}>Anterior</OutlinedButton>
          <Button testId="tour-next" onClick={() => setFlow(next)} color="var(--pomo-primary)" radius={14}>{last ? 'Terminar' : 'Siguiente'}</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
