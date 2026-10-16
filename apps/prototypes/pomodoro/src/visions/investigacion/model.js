// Modelo de presentación de la visión Investigación. Puro: solo transforma el estado del contrato
// (los campos que expone el store) en lo que muestra la visión. No calcula ni guarda la sesión.

import { breakAfter } from '../../session/contract.js';

export const FOCUS = 'FOCUS';
export const SHORT_BREAK = 'SHORT_BREAK';
export const LONG_BREAK = 'LONG_BREAK';

export const NOMBRES_FASE = Object.freeze({ FOCUS: 'Enfoque', SHORT_BREAK: 'Descanso corto', LONG_BREAK: 'Descanso largo' });
export const CLASE_FASE = Object.freeze({ FOCUS: 'enfoque', SHORT_BREAK: 'descanso', LONG_BREAK: 'descanso' });

const minusculas = (tipo) => NOMBRES_FASE[tipo].toLowerCase();

/** Secuencia de fases de la sesión (el último enfoque no va seguido de descanso). */
export function fasesDe(s) {
  const n = s.activeBlocks.length;
  const out = [];
  for (let b = 1; b <= n; b += 1) {
    out.push({ tipo: FOCUS, min: s.activeConfig.workMinutes, bloque: b });
    const descanso = b < n ? breakAfter(s.activeConfig, b) : null;
    if (descanso) out.push({ tipo: descanso.phase === 'LONG_BREAK' ? LONG_BREAK : SHORT_BREAK, min: descanso.minutes, bloque: b });
  }
  return out;
}

export const indiceActual = (s) => fasesDe(s).findIndex((f) => f.bloque === s.currentBlockIndex && (s.currentPhase === FOCUS ? f.tipo === FOCUS : f.tipo !== FOCUS));

export const minutosTotales = (fases) => fases.reduce((a, f) => a + f.min, 0);

/** Fracción 0..1 transcurrida de la fase actual. */
export function progreso(s) {
  if (!(s.phaseTotalSeconds > 0)) return 1;
  return Math.min(1, Math.max(0, 1 - s.secondsRemaining / s.phaseTotalSeconds));
}

/** Segundos de aviso efectivos: en fases cortas el aviso llega, como máximo, a la mitad de la fase. */
export const umbralAviso = (avisoSeg, totalSeg) => Math.min(avisoSeg, totalSeg / 2);

/** Segundos que faltan si hay que mostrar el aviso previo ahora; si no, null. */
export function avisoPrevio(s, avisoSeg) {
  if (avisoSeg <= 0 || !s.isTimerRunning || s.secondsRemaining <= 0) return null;
  return s.secondsRemaining <= umbralAviso(avisoSeg, s.phaseTotalSeconds) ? s.secondsRemaining : null;
}

export function textoAviso(s, fases, segundos) {
  const sig = fases[indiceActual(s) + 1];
  const despues = sig ? `Después: ${minusculas(sig.tipo)} de ${sig.min} min.` : 'Después termina la sesión.';
  return `En unos ${segundos} segundos termina ${minusculas(s.currentPhase)}. ${despues}`;
}

/** ¿La fase que empieza espera confirmación? (`avance`: 'auto' | 'enfoque' | 'todas'). */
export const debeEsperar = (avance, tipoSiguiente) => avance === 'todas' || (avance === 'enfoque' && tipoSiguiente === FOCUS);

/** Mensaje al cambiar de fase. `saltada`: la persona la saltó ella misma. */
export function mensajeCambio({ terminada, siguiente, espera, saltada }) {
  const que = `${saltada ? 'Saltaste' : 'Terminó'} ${minusculas(terminada)}.`;
  return espera ? `${que} Cuando quieras, pulsa «Empezar» para ${minusculas(siguiente)}.` : `${que} Sigue ${minusculas(siguiente)}.`;
}

/** Hora estimada de término (ms), sin contar esperas entre fases. */
export function horaDeTermino(s, fases, ahoraMs) {
  let seg = s.secondsRemaining;
  for (let i = indiceActual(s) + 1; i < fases.length; i += 1) seg += fases[i].min * 60;
  return ahoraMs + seg * 1000;
}

export const mmss = (segundos) => {
  const t = Math.max(0, Math.ceil(segundos));
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

export const hhmm = (ms) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** «1 h 5 min», «25 min». */
export function duracion(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Estado visible de la fase: 'esperando' | 'pausado' | 'corriendo'. */
export const estadoDe = (s, esperando) => (esperando ? 'esperando' : s.isTimerRunning ? 'corriendo' : 'pausado');

const ETIQUETA_ESTADO = Object.freeze({ corriendo: 'En marcha', pausado: 'En pausa', esperando: 'Esperando' });
export const etiquetaEstado = (estado) => ETIQUETA_ESTADO[estado];

/** Resumen de la sesión para mostrarlo también dentro de Ajustes. */
export function resumenDeSesion(s, esperando, texto) {
  const estado = estadoDe(s, esperando);
  return {
    etiqueta: `${NOMBRES_FASE[s.currentPhase]} · ${ETIQUETA_ESTADO[estado]}`,
    tiempo: `${estado === 'esperando' ? 'Dura' : 'Quedan'} ${mmss(s.secondsRemaining)}`,
    texto: texto || '',
  };
}
