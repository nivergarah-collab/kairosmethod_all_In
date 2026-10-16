// Registro de visiones. Puro (sin DOM). Cada visión es una capa de presentación sobre el contrato
// de sesión común (session/contract.js); la visión elegida NO se guarda con la sesión.

export const DEFAULT_VISION = 'pomodoro';

/**
 * `preview` son los colores de la vista previa ligera (SVG) del selector. Son una aproximación
 * de cada visión, no una captura.
 * `implemented` pasa a true cuando la visión tiene su propia capa de presentación (tareas 3a–3d).
 */
export const VISIONS = [
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    tagline: 'Reloj con arco, atajos y modo enfoque.',
    source: 'pomodoro',
    preview: { bg: '#faf8f5', surface: '#ffffff', ink: '#1f1b16', accent: '#d9483b', accent2: '#10b981' },
    implemented: true,
  },
  {
    id: 'calma',
    name: 'Calma',
    tagline: 'Planear la tarde: módulos, descansos y hora de término.',
    source: 'pomodoro-calma',
    preview: { bg: '#f3ede8', surface: '#fbf8f5', ink: '#1c2422', accent: '#6b8f86', accent2: '#c9a58f' },
    implemented: true,
  },
  {
    id: 'vision',
    name: 'Visión',
    tagline: 'Mapa de ruta de fichas con material por bloque.',
    source: 'pomodoro-vision',
    preview: { bg: '#f1ebdd', surface: '#fffdf7', ink: '#2f2a22', accent: '#b3481f', accent2: '#4f6d4c' },
    implemented: true,
  },
  {
    id: 'paridad',
    name: 'Paridad',
    tagline: 'Copia fiel de la app Android PomoStudy.',
    source: 'pomodoro-paridad',
    preview: { bg: '#fffbff', surface: '#f1f5f9', ink: '#0f172a', accent: '#d9483b', accent2: '#e28743' },
    implemented: true,
  },
  {
    id: 'investigacion',
    name: 'Investigación',
    tagline: 'Perfiles de partida y todos los ajustes editables.',
    source: 'pomodoro-investigacion',
    preview: { bg: '#f7f6f2', surface: '#ffffff', ink: '#1c2422', accent: '#2f6f62', accent2: '#8a6d3b' },
    implemented: true,
  },
];

export const isVisionId = (id) => VISIONS.some((v) => v.id === id);
export const getVision = (id) => VISIONS.find((v) => v.id === id) ?? VISIONS.find((v) => v.id === DEFAULT_VISION);

/** Índice al mover el foco con flechas dentro de una lista circular de `count` opciones. */
export function moveIndex(current, key, count, columns = 1) {
  if (count <= 0) return -1;
  const last = count - 1;
  switch (key) {
    case 'ArrowRight':
      return current >= last ? 0 : current + 1;
    case 'ArrowLeft':
      return current <= 0 ? last : current - 1;
    case 'ArrowDown':
      return current + columns > last ? Math.min(current % columns, last) : current + columns;
    case 'ArrowUp':
      return current - columns < 0 ? last - ((last - current) % columns) : current - columns;
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return current;
  }
}
