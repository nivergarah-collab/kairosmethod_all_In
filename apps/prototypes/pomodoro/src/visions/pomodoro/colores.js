// Colores propios de la visión Pomodoro (los del prototipo «pomodoro», tema cálido). Claro y oscuro siguen al tema de la app.
export const CLARO = Object.freeze({
  bg: '#faf8f5', surface: '#ffffff', surface2: '#f3efe9', line: '#e7e1d8', ink: '#1f1b16', ink2: '#5f574d', ink3: '#6b6358',
  focus: '#c4492f', focusSoft: '#f8e6e1', focusText: '#a63a22', focusInk: '#ffffff',
  rest: '#2f7f62', restSoft: '#e0f0e8', restText: '#23694f', restInk: '#ffffff', danger: '#b3261e',
});
export const OSCURO = Object.freeze({
  bg: '#14110e', surface: '#1d1914', surface2: '#26211b', line: '#332d25', ink: '#f4efe8', ink2: '#b8afa2', ink3: '#a0978a',
  focus: '#ef7a5f', focusSoft: '#3a211b', focusText: '#ef7a5f', focusInk: '#1a0f0b',
  rest: '#5cc29b', restSoft: '#1c3329', restText: '#5cc29b', restInk: '#0d1f17', danger: '#ff8a80',
});

const canal = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}
export function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Pares texto/fondo que se usan en pantalla y deben cumplir AA (4.5:1). */
export const PARES = Object.freeze([
  ['ink', 'bg'], ['ink', 'surface'], ['ink2', 'surface'], ['ink2', 'bg'], ['ink3', 'bg'], ['ink3', 'surface'], ['ink3', 'focusSoft'],
  ['focusText', 'focusSoft'], ['restText', 'restSoft'], ['focusInk', 'focus'], ['restInk', 'rest'], ['focusText', 'surface'], ['restText', 'surface'], ['danger', 'bg'],
]);

/** Variables CSS `--vp-*` para el tema pedido. */
export function tokensPara(oscuro) {
  const t = oscuro ? OSCURO : CLARO;
  return Object.fromEntries(Object.entries(t).map(([k, v]) => [`--vp-${k}`, v]));
}
