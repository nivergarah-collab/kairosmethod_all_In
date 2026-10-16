// Modelo de presentación de la visión Pomodoro (adaptada del prototipo «pomodoro»). Puro: solo
// transforma el estado del contrato en lo que muestra la pantalla. No guarda ni calcula la sesión.

import { breakAfter, planTotals } from '../../session/contract.js';

export const TONOS = Object.freeze({ FOCUS: 'focus', SHORT_BREAK: 'rest', LONG_BREAK: 'rest' });
export const ETIQUETAS_FASE = Object.freeze({ FOCUS: 'Enfoque', SHORT_BREAK: 'Descanso corto', LONG_BREAK: 'Descanso largo' });

export const tonoDe = (fase) => TONOS[fase] ?? 'focus';

const pad = (n) => String(n).padStart(2, '0');

/** mm:ss (o h:mm:ss) de una cuenta regresiva en segundos. */
export function reloj(segundos) {
  const t = Math.max(0, Math.ceil(Number(segundos) || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(t % 60)}` : `${pad(m)}:${pad(t % 60)}`;
}

/** «1 h 05 min», «42 min». */
export function duracion(minutos) {
  const m = Math.round(Math.max(0, minutos));
  const h = Math.floor(m / 60);
  return h === 0 ? `${m} min` : `${h} h ${pad(m % 60)} min`;
}

export function horaDelDia(ms) {
  const d = new Date(ms);
  return Number.isFinite(d.getTime()) ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
}

/** Tramos que siguen a la fase actual (sin descanso tras el último bloque; largo cuando el bloque es múltiplo de 4). */
export function tramosRestantes(s) {
  const n = s.activeBlocks.length;
  const out = [];
  let fase = s.currentPhase;
  let bloque = s.currentBlockIndex;
  while (true) {
    if (fase === 'FOCUS') {
      if (bloque >= n) break;
      const descanso = breakAfter(s.activeConfig, bloque);
      if (descanso) {
        fase = descanso.phase;
        out.push({ fase, minutos: descanso.minutes });
      } else {
        // Sin descanso: sigue directo el próximo enfoque.
        bloque += 1;
        out.push({ fase: 'FOCUS', minutos: s.activeConfig.workMinutes });
      }
    } else {
      bloque += 1;
      fase = 'FOCUS';
      out.push({ fase, minutos: s.activeConfig.workMinutes });
    }
  }
  return out;
}

export const siguiente = (s) => tramosRestantes(s)[0] ?? null;

/** Segundos que faltan para terminar toda la sesión. */
export const segundosRestantesSesion = (s) => s.secondsRemaining + tramosRestantes(s).reduce((a, t) => a + t.minutos * 60, 0);

export const bloquesHechos = (s) => s.activeBlocks.filter((b) => b.isCompleted).length;

export const minutosPlanificados = (s) => planTotals({ ...s.activeConfig, blocksCount: s.activeBlocks.length }).totalMinutes;

/** 0..1 del avance de la fase actual. */
export const avanceFase = (s) => (s.phaseTotalSeconds > 0 ? Math.max(0, Math.min(1, 1 - s.secondsRemaining / s.phaseTotalSeconds)) : 1);

export const estadoTexto = (s) => (s.isTimerRunning ? 'En marcha' : s.secondsRemaining >= s.phaseTotalSeconds ? 'Lista para empezar' : 'En pausa');

export const CONSEJOS = Object.freeze([
  'Levántate y estira la espalda y los hombros.',
  'Toma un vaso de agua.',
  'Mira un punto lejano durante 20 segundos para descansar la vista.',
  'Respira hondo cuatro veces, despacio.',
  'Camina un minuto, aunque sea por la habitación.',
  'Aleja el teléfono: este descanso es para ti.',
]);

/** Sugerencia del descanso que sigue al bloque `bloque` (1..N); '' si no aplica. */
export const consejo = (bloque) => (Number.isInteger(bloque) && bloque >= 1 ? CONSEJOS[(bloque - 1) % CONSEJOS.length] : '');

const COLORES_ICONO = { focus: '#c4492f', rest: '#2f7f62' };

/** Icono de pestaña: anillo de progreso para seguir el tiempo desde otra pestaña. */
export function iconoSvg(avance, tono) {
  const p = Math.max(0, Math.min(1, Number(avance) || 0));
  const color = COLORES_ICONO[tono] ?? COLORES_ICONO.focus;
  const C = 2 * Math.PI * 12;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="#d9d2c7" stroke-width="5"/><circle cx="16" cy="16" r="12" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(C * p).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 16 16)"/></svg>`;
}
export const iconoHref = (avance, tono) => `data:image/svg+xml,${encodeURIComponent(iconoSvg(avance, tono))}`;

/** Texto de la pestaña del navegador: «12:34 · Enfoque». */
export const tituloPestana = (s, base) => `${reloj(s.secondsRemaining)} · ${ETIQUETAS_FASE[s.currentPhase] ?? 'Enfoque'} · ${base}`;
