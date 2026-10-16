import test from 'node:test';
import assert from 'node:assert/strict';
import { reloj, duracion, tramosRestantes, siguiente, segundosRestantesSesion, minutosPlanificados, avanceFase, estadoTexto, consejo, CONSEJOS, iconoSvg, iconoHref, tituloPestana, tonoDe, bloquesHechos } from './model.js';
import { CLARO, OSCURO, PARES, contraste, tokensPara } from './colores.js';

const base = (o = {}) => ({
  activeBlocks: Array.from({ length: 4 }, (_, i) => ({ index: i + 1, isCompleted: false })),
  currentPhase: 'FOCUS', currentBlockIndex: 1, secondsRemaining: 1500, phaseTotalSeconds: 1500, isTimerRunning: false,
  activeConfig: { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 }, ...o,
});

test('reloj cuenta hacia abajo con mm:ss y h:mm:ss', () => {
  assert.equal(reloj(1500), '25:00');
  assert.equal(reloj(59.2), '01:00');
  assert.equal(reloj(3725), '1:02:05');
  assert.equal(reloj(-3), '00:00');
  assert.equal(reloj(NaN), '00:00');
});

test('duracion y consejo', () => {
  assert.equal(duracion(42), '42 min');
  assert.equal(duracion(125), '2 h 05 min');
  assert.equal(consejo(1), CONSEJOS[0]);
  assert.equal(consejo(7), CONSEJOS[0]);
  assert.equal(consejo(0), '');
  assert.equal(consejo(1.5), '');
});

test('tramos restantes: descanso corto, largo en múltiplos de 4 y sin descanso tras el último', () => {
  const s = base();
  assert.deepEqual(tramosRestantes(s).map((t) => t.fase), ['SHORT_BREAK', 'FOCUS', 'SHORT_BREAK', 'FOCUS', 'SHORT_BREAK', 'FOCUS']);
  assert.deepEqual(siguiente(s), { fase: 'SHORT_BREAK', minutos: 5 });
  const ocho = base({ activeBlocks: Array.from({ length: 8 }, (_, i) => ({ index: i + 1 })), currentBlockIndex: 4 });
  assert.equal(siguiente(ocho).fase, 'LONG_BREAK');
  assert.deepEqual(tramosRestantes(base({ currentBlockIndex: 4 })), []);
  assert.equal(siguiente(base({ currentBlockIndex: 4 })), null);
  assert.equal(siguiente(base({ currentPhase: 'SHORT_BREAK', currentBlockIndex: 2 })).fase, 'FOCUS');
});

test('segundos restantes y minutos planificados', () => {
  const s = base();
  assert.equal(minutosPlanificados(s), 4 * 25 + 3 * 5);
  assert.equal(segundosRestantesSesion(s), 1500 + (5 + 25 + 5 + 25 + 5 + 25) * 60);
  assert.equal(segundosRestantesSesion(base({ currentBlockIndex: 4, secondsRemaining: 90 })), 90);
});

test('avance y estado', () => {
  assert.equal(avanceFase(base()), 0);
  assert.equal(avanceFase(base({ secondsRemaining: 750 })), 0.5);
  assert.equal(avanceFase(base({ phaseTotalSeconds: 0 })), 1);
  assert.equal(estadoTexto(base()), 'Lista para empezar');
  assert.equal(estadoTexto(base({ secondsRemaining: 100 })), 'En pausa');
  assert.equal(estadoTexto(base({ isTimerRunning: true })), 'En marcha');
});

test('tono, hechos, icono y título', () => {
  assert.equal(tonoDe('FOCUS'), 'focus');
  assert.equal(tonoDe('LONG_BREAK'), 'rest');
  assert.equal(bloquesHechos(base({ activeBlocks: [{ isCompleted: true }, { isCompleted: false }] })), 1);
  assert.match(iconoSvg(0.5, 'rest'), /#2f7f62/);
  assert.match(iconoSvg(2, 'focus'), /stroke-dasharray="75\.40 75\.40"/);
  assert.match(iconoSvg(-1, 'x'), /#c4492f/);
  assert.ok(iconoHref(0.1, 'focus').startsWith('data:image/svg+xml,'));
  assert.equal(tituloPestana(base({ secondsRemaining: 61 }), 'App'), '01:01 · Enfoque · App');
});

test('colores: todos los pares de texto cumplen AA (4.5:1) en claro y oscuro', () => {
  for (const [nombre, t] of [['claro', CLARO], ['oscuro', OSCURO]]) {
    for (const [a, b] of PARES) assert.ok(contraste(t[a], t[b]) >= 4.5, `${nombre}: ${a} sobre ${b} = ${contraste(t[a], t[b]).toFixed(2)}`);
  }
  assert.equal(tokensPara(true)['--vp-bg'], OSCURO.bg);
  assert.equal(tokensPara(false)['--vp-bg'], CLARO.bg);
});

test('tramosRestantes sin descansos va directo de enfoque en enfoque', () => {
  const s = base({ activeConfig: { workMinutes: 25, shortBreakMinutes: 0, longBreakMinutes: 15, longBreakEvery: 0 } });
  assert.deepEqual(tramosRestantes(s).map((t) => t.fase), ['FOCUS', 'FOCUS', 'FOCUS']);
  assert.equal(minutosPlanificados(s), 100);
});

test('descanso largo cada 2 bloques en los tramos y en los minutos planificados', () => {
  const s = base({ activeConfig: { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 2 } });
  assert.deepEqual(tramosRestantes(s).map((t) => t.fase), ['SHORT_BREAK', 'FOCUS', 'LONG_BREAK', 'FOCUS', 'SHORT_BREAK', 'FOCUS']);
  assert.equal(minutosPlanificados(s), 100 + 5 + 15 + 5);
});
