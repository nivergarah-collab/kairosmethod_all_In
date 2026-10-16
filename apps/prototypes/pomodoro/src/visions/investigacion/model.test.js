import test from 'node:test';
import assert from 'node:assert/strict';
import { fasesDe, indiceActual, minutosTotales, progreso, avisoPrevio, textoAviso, debeEsperar, mensajeCambio, horaDeTermino, mmss, duracion, hhmm, resumenDeSesion, estadoDe, umbralAviso } from './model.js';

const estado = (o = {}) => ({
  activeBlocks: Array.from({ length: 5 }, (_, i) => ({ index: i + 1 })),
  activeConfig: { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 },
  currentPhase: 'FOCUS', currentBlockIndex: 1, secondsRemaining: 1500, phaseTotalSeconds: 1500, isTimerRunning: true,
  ...o,
});

test('fasesDe: enfoque y descanso, descanso largo tras el bloque 4, sin descanso tras el último', () => {
  const f = fasesDe(estado());
  assert.deepEqual(f.map((x) => x.tipo), ['FOCUS', 'SHORT_BREAK', 'FOCUS', 'SHORT_BREAK', 'FOCUS', 'SHORT_BREAK', 'FOCUS', 'LONG_BREAK', 'FOCUS']);
  assert.equal(minutosTotales(f), 5 * 25 + 3 * 5 + 15);
  assert.equal(fasesDe(estado({ activeBlocks: [{ index: 1 }] })).length, 1);
});

test('indiceActual sigue la fase del contrato', () => {
  assert.equal(indiceActual(estado()), 0);
  assert.equal(indiceActual(estado({ currentPhase: 'SHORT_BREAK' })), 1);
  assert.equal(indiceActual(estado({ currentBlockIndex: 3 })), 4);
});

test('progreso va de 0 a 1 y no se sale de rango', () => {
  assert.equal(progreso(estado()), 0);
  assert.equal(progreso(estado({ secondsRemaining: 750 })), 0.5);
  assert.equal(progreso(estado({ secondsRemaining: 0 })), 1);
  assert.equal(progreso(estado({ phaseTotalSeconds: 0 })), 1);
  assert.equal(progreso(estado({ secondsRemaining: 2000 })), 0);
});

test('aviso previo: solo con aviso activo, corriendo y dentro del umbral (máximo la mitad de la fase)', () => {
  assert.equal(avisoPrevio(estado({ secondsRemaining: 59 }), 60), 59);
  assert.equal(avisoPrevio(estado({ secondsRemaining: 61 }), 60), null);
  assert.equal(avisoPrevio(estado({ secondsRemaining: 30 }), 0), null);
  assert.equal(avisoPrevio(estado({ secondsRemaining: 30, isTimerRunning: false }), 60), null);
  assert.equal(avisoPrevio(estado({ secondsRemaining: 0 }), 60), null);
  // fase de 90 s con aviso de 120 s: el aviso llega a la mitad (45 s)
  assert.equal(umbralAviso(120, 90), 45);
  assert.equal(avisoPrevio(estado({ phaseTotalSeconds: 90, secondsRemaining: 50 }), 120), null);
  assert.equal(avisoPrevio(estado({ phaseTotalSeconds: 90, secondsRemaining: 45 }), 120), 45);
});

test('textoAviso dice qué viene después', () => {
  const s = estado({ secondsRemaining: 30 });
  assert.match(textoAviso(s, fasesDe(s), 30), /En unos 30 segundos termina enfoque\. Después: descanso corto de 5 min\./);
  const u = estado({ activeBlocks: [{ index: 1 }], secondsRemaining: 20 });
  assert.match(textoAviso(u, fasesDe(u), 20), /Después termina la sesión\./);
});

test('debeEsperar según el modo de avance', () => {
  assert.equal(debeEsperar('auto', 'FOCUS'), false);
  assert.equal(debeEsperar('enfoque', 'FOCUS'), true);
  assert.equal(debeEsperar('enfoque', 'SHORT_BREAK'), false);
  assert.equal(debeEsperar('todas', 'LONG_BREAK'), true);
});

test('mensajeCambio distingue saltar de terminar y esperar de seguir', () => {
  assert.equal(mensajeCambio({ terminada: 'FOCUS', siguiente: 'SHORT_BREAK', espera: false, saltada: false }), 'Terminó enfoque. Sigue descanso corto.');
  assert.equal(mensajeCambio({ terminada: 'FOCUS', siguiente: 'SHORT_BREAK', espera: true, saltada: true }), 'Saltaste enfoque. Cuando quieras, pulsa «Empezar» para descanso corto.');
});

test('horaDeTermino suma lo que queda y las fases siguientes', () => {
  const s = estado({ activeBlocks: [{ index: 1 }, { index: 2 }], secondsRemaining: 600 });
  assert.equal(horaDeTermino(s, fasesDe(s), 0), (600 + 5 * 60 + 25 * 60) * 1000);
});

test('formatos', () => {
  assert.equal(mmss(0), '00:00');
  assert.equal(mmss(65), '01:05');
  assert.equal(mmss(0.2), '00:01');
  assert.equal(mmss(-5), '00:00');
  assert.equal(duracion(25), '25 min');
  assert.equal(duracion(60), '1 h');
  assert.equal(duracion(105), '1 h 45 min');
  assert.match(hhmm(new Date(2026, 9, 13, 8, 5).getTime()), /^08:05$/);
});

test('estado y resumen de sesión', () => {
  assert.equal(estadoDe(estado(), false), 'corriendo');
  assert.equal(estadoDe(estado({ isTimerRunning: false }), false), 'pausado');
  assert.equal(estadoDe(estado({ isTimerRunning: false }), true), 'esperando');
  assert.deepEqual(resumenDeSesion(estado({ secondsRemaining: 90 }), false, 'hola'), { etiqueta: 'Enfoque · En marcha', tiempo: 'Quedan 01:30', texto: 'hola' });
  assert.equal(resumenDeSesion(estado({ isTimerRunning: false }), true).tiempo, 'Dura 25:00');
});

test('fasesDe e indiceActual sin descansos', () => {
  const s = estado({ activeConfig: { workMinutes: 25, shortBreakMinutes: 0, longBreakMinutes: 15, longBreakEvery: 0 }, currentBlockIndex: 3 });
  assert.deepEqual(fasesDe(s).map((x) => x.tipo), ['FOCUS', 'FOCUS', 'FOCUS', 'FOCUS', 'FOCUS']);
  assert.equal(indiceActual(s), 2);
});

test('fasesDe con descanso largo cada 3 bloques e indiceActual en el descanso', () => {
  const s = estado({ activeConfig: { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 3 }, currentBlockIndex: 3, currentPhase: 'LONG_BREAK' });
  assert.deepEqual(fasesDe(s).map((x) => x.tipo), ['FOCUS', 'SHORT_BREAK', 'FOCUS', 'SHORT_BREAK', 'FOCUS', 'LONG_BREAK', 'FOCUS', 'SHORT_BREAK', 'FOCUS']);
  assert.equal(indiceActual(s), 5);
});
