// Modelo de presentación de la visión Calma. Puro: solo transforma el estado del contrato
// (campos que expone el store) en lo que muestra la visión. No guarda ni calcula la sesión.

import { breakAfter } from '../../session/contract.js';

export const BLOCK = 'block';
export const BREAK = 'break';

/** Segmentos de la tarde: módulo, descanso, módulo… (sin descanso tras el último). */
export function buildSegments(s) {
  const n = s.activeBlocks.length;
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push({ kind: BLOCK, minutes: s.activeConfig.workMinutes, blockIndex: i });
    const rest = i < n ? breakAfter(s.activeConfig, i) : null;
    if (rest) out.push({ kind: BREAK, minutes: rest.minutes, blockIndex: i });
  }
  return out;
}

/** Posición del segmento actual (puede no haber descansos entre bloques, así que se busca, no se calcula). */
export function currentSegmentIndex(s) {
  const kind = s.currentPhase === 'FOCUS' ? BLOCK : BREAK;
  return buildSegments(s).findIndex((seg) => seg.kind === kind && seg.blockIndex === s.currentBlockIndex);
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Ítems para la «línea de la tarde»: relleno 0..1 según el avance real del contrato. */
export function buildTimeline(s) {
  const current = currentSegmentIndex(s);
  const done = s.phaseTotalSeconds > 0 ? 1 - s.secondsRemaining / s.phaseTotalSeconds : 1;
  return buildSegments(s).map((seg, i) => ({
    ...seg,
    current: i === current,
    fill: i < current ? 1 : i === current ? clamp01(done) : 0,
  }));
}

/** «Quedan …» en minutos redondeados hacia arriba, sin segundos. */
export function quedan(seconds) {
  if (seconds < 60) return 'menos de un minuto';
  return `${Math.ceil(seconds / 60)} min`;
}

/** Minutos de estudio planeados (solo módulos). */
export const plannedStudyMinutes = (s) => s.activeBlocks.length * s.activeConfig.workMinutes;

/** Hora estimada de término (ms): lo que queda de la fase actual más los segmentos siguientes. */
export function estimatedEndMs(s, nowMs) {
  const segs = buildSegments(s);
  const current = currentSegmentIndex(s);
  let seconds = s.secondsRemaining;
  for (let i = current + 1; i < segs.length; i++) seconds += segs[i].minutes * 60;
  return nowMs + seconds * 1000;
}

/** 105 -> "1 h 45 min", 60 -> "1 h", 25 -> "25 min" */
export function formatDuration(minutes) {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

export function formatClock(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** ¿Pasó de un descanso al enfoque? (Calma espera un «Estoy listo» en ese momento.) */
export const cameFromBreak = (prevPhase, phase) => prevPhase != null && prevPhase !== 'FOCUS' && phase === 'FOCUS';
