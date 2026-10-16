// Tokens de color de la visión Investigación (datos). La vista los aplica como variables CSS
// `--vi-*` solo dentro de su contenedor; claro/oscuro sigue al tema de la app.
// PARES: [texto, fondo, mínimo] que deben cumplirse en ambos temas (los comprueba colores.test.js).

export const CLARO = Object.freeze({
  fondo: '#f7f6f2', superficie: '#ffffff', texto: '#1c2422', suave: '#4a5753', borde: '#76827e',
  enfoque: '#1d5c58', enfoqueSobre: '#ffffff', enfoqueFondo: '#dcebe9',
  descanso: '#2b4c8c', descansoSobre: '#ffffff', descansoFondo: '#e0e8f6',
  anillo: '#d9dedb', foco: '#1b3fbf', aviso: '#6b4a00', avisoFondo: '#fff3d1',
});

export const OSCURO = Object.freeze({
  fondo: '#14181a', superficie: '#1d2326', texto: '#e8eeec', suave: '#b4c0bc', borde: '#7d8a86',
  enfoque: '#7fcfc8', enfoqueSobre: '#0c1d1b', enfoqueFondo: '#1d3533',
  descanso: '#9db9f0', descansoSobre: '#0d1830', descansoFondo: '#202c45',
  anillo: '#2f383b', foco: '#9fb7ff', aviso: '#f1d28a', avisoFondo: '#3a2f10',
});

export const PARES = Object.freeze([
  ['texto', 'fondo', 4.5], ['texto', 'superficie', 4.5], ['suave', 'fondo', 4.5], ['suave', 'superficie', 4.5],
  ['enfoque', 'fondo', 4.5], ['enfoque', 'superficie', 4.5], ['enfoqueSobre', 'enfoque', 4.5],
  ['enfoque', 'enfoqueFondo', 4.5], ['descanso', 'fondo', 4.5], ['descanso', 'superficie', 4.5],
  ['descansoSobre', 'descanso', 4.5], ['descanso', 'descansoFondo', 4.5],
  ['aviso', 'avisoFondo', 4.5],
  // componentes de interfaz (3:1)
  ['borde', 'fondo', 3], ['borde', 'superficie', 3], ['foco', 'fondo', 3], ['foco', 'superficie', 3], ['enfoque', 'anillo', 3], ['descanso', 'anillo', 3],
]);

// Variantes de alto contraste: solo si el dispositivo lo pide (prefers-contrast: more) y el tema de la app es «del sistema».
export const CLARO_ALTO = Object.freeze({
  fondo: '#ffffff', superficie: '#ffffff', texto: '#000000', suave: '#222a27', borde: '#3d4743',
  enfoque: '#0b3d39', enfoqueSobre: '#ffffff', enfoqueFondo: '#d3e8e5',
  descanso: '#16337a', descansoSobre: '#ffffff', descansoFondo: '#dbe5f7',
  anillo: '#c4cbc8', foco: '#102a99', aviso: '#4a3200', avisoFondo: '#fff3d1',
});

export const OSCURO_ALTO = Object.freeze({
  fondo: '#000000', superficie: '#0b0e0f', texto: '#ffffff', suave: '#dbe4e1', borde: '#a9b6b2',
  enfoque: '#9fe3dc', enfoqueSobre: '#001311', enfoqueFondo: '#12302d',
  descanso: '#b9ccf7', descansoSobre: '#050c1c', descansoFondo: '#182540',
  anillo: '#3a454a', foco: '#c0cfff', aviso: '#ffe3a1', avisoFondo: '#33280a',
});

// Mismos pares, con mínimo de 7 para texto y 4,5 para componentes.
export const PARES_ALTO = Object.freeze(PARES.map(([a, b, m]) => [a, b, m === 4.5 ? 7 : 4.5]));

export function luminancia(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Tokens a usar: oscuro/claro según la app y, si el tema es «del sistema», alto contraste cuando se pide. */
export function tokensPara({ oscuro, altoContraste }) {
  if (altoContraste) return oscuro ? OSCURO_ALTO : CLARO_ALTO;
  return oscuro ? OSCURO : CLARO;
}
