// Paletas propias SUGERIDAS por cada visión. No se comparten con la página principal ni con otras visiones: cada una
// solo pisa las variables de su propio contenedor. «predeterminada» es el aspecto original de la visión (no pisa nada).
// Claro/oscuro es el tema de la app; cada paleta trae las dos variantes. Puro: sin DOM.
import { juego, PARES_TEXTO, PARES_GRAFICOS } from '../../palettes.js';
import { contraste } from '../investigacion/colores.js';

export const PREDETERMINADA = 'predeterminada';
export const CLAVE_BASE = 'kairos_pomodoro_vision_';
export const claveDe = (visionId) => `${CLAVE_BASE}${visionId}_palette_v1`;

// ───── Calma (variables --vc-*, definidas en calma.css) ─────
const CALMA_BASE = {
  claro: { fondo: '#F3EDE8', papel: '#FBF8F5', tinta: '#3A3236', suave: '#6A5D61', linea: '#E1D6D0', miel: '#E2A24F', salvia: '#9DB09A', ciruela: '#6E4B5F', sobre: '#FFFFFF', foco: '#B87822' },
  oscuro: { fondo: '#2A2427', papel: '#332C30', tinta: '#F0E6DD', suave: '#B6A8AB', linea: '#4A4045', miel: '#E8B063', salvia: '#8AA286', ciruela: '#D8B0C6', sobre: '#2A2427', foco: '#E8B063' },
};
const CALMA = [
  {
    id: 'medianoche', nombre: 'Medianoche', descripcion: 'Azules de crepúsculo con un toque de miel.',
    claro: { fondo: '#E9EDF5', papel: '#F7F9FD', tinta: '#1F2A44', suave: '#4D5A78', linea: '#CBD3E3', miel: '#E0A93B', salvia: '#8FA9C8', ciruela: '#34508C', sobre: '#FFFFFF', foco: '#2B4A8F' },
    oscuro: { fondo: '#141B2E', papel: '#1C2540', tinta: '#E6ECFA', suave: '#A9B6D3', linea: '#34416A', miel: '#F0C163', salvia: '#7C9AC4', ciruela: '#A9BDF0', sobre: '#141B2E', foco: '#F0C163' },
  },
  {
    id: 'amanecer', nombre: 'Amanecer', descripcion: 'Durazno y terracota suaves, para empezar el día.',
    claro: { fondo: '#FBEFE6', papel: '#FFF9F4', tinta: '#43302B', suave: '#75554C', linea: '#EBD3C6', miel: '#E58A5B', salvia: '#A8B89A', ciruela: '#A5472F', sobre: '#FFFFFF', foco: '#A5472F' },
    oscuro: { fondo: '#2E1F1C', papel: '#3A2825', tinta: '#FBE9DE', suave: '#D2B3A7', linea: '#55403B', miel: '#F2A67C', salvia: '#9AAE8A', ciruela: '#F2A98F', sobre: '#2E1F1C', foco: '#F2A67C' },
  },
];
const CALMA_PARES = [['tinta', 'fondo', 4.5], ['tinta', 'papel', 4.5], ['suave', 'fondo', 4.5], ['suave', 'papel', 4.5], ['sobre', 'ciruela', 4.5], ['ciruela', 'fondo', 4.5], ['foco', 'fondo', 3], ['miel', 'fondo', 1.2]];

// ───── Visión (variables --vv-*, definidas en vision.css) ─────
const VISION_BASE = {
  claro: { bg: '#f1ebdd', ink: '#2f2a22', ink2: '#5f5442', accent: '#b3481f', 'on-accent': '#ffffff', sage: '#4f6d4c', surface: '#fffdf7', high: '#ebe3d1', line: '#d6ccb6', done: '#dde7d6', 'done-ink': '#3c5238', btn: '#3a2a1e', 'btn-ink': '#ffffff', big: '#2f2a22', 'open-bg': '#fffdf7', 'open-ink': '#2f2a22', 'open-ring': '#4f6d4c', error: '#a3231b' },
  oscuro: { bg: '#2a211b', ink: '#f6ead4', ink2: '#cdbda1', accent: '#e6a23c', 'on-accent': '#2a1a0a', sage: '#9bbb8e', surface: '#35291f', high: '#3f3329', line: '#574838', done: '#4d5b46', 'done-ink': '#e3ecd9', btn: '#e6a23c', 'btn-ink': '#2a1a0a', big: '#f6ead4', 'open-bg': '#f6ecd9', 'open-ink': '#2a211b', 'open-ring': '#e6a23c', error: '#ff9a8f' },
};
const VISION = [
  {
    id: 'tinta', nombre: 'Tinta y papel', descripcion: 'Gris azulado sobrio, como tinta sobre papel.',
    claro: { bg: '#eceef2', ink: '#1d222c', ink2: '#4c5566', accent: '#2f4f8f', 'on-accent': '#ffffff', sage: '#2f6b5e', surface: '#fbfbfd', high: '#e0e3ea', line: '#c3c8d3', done: '#d7e6e1', 'done-ink': '#1e4a3f', btn: '#1d2740', 'btn-ink': '#ffffff', big: '#1d222c', 'open-bg': '#fbfbfd', 'open-ink': '#1d222c', 'open-ring': '#2f6b5e', error: '#a3231b' },
    oscuro: { bg: '#161a22', ink: '#e9edf5', ink2: '#b3bccd', accent: '#8fb0f0', 'on-accent': '#0c1a38', sage: '#7fcfb8', surface: '#1f2430', high: '#2a303e', line: '#3c4457', done: '#2d4a42', 'done-ink': '#d5efe6', btn: '#8fb0f0', 'btn-ink': '#0c1a38', big: '#e9edf5', 'open-bg': '#e8ecf4', 'open-ink': '#161a22', 'open-ring': '#8fb0f0', error: '#ff9a8f' },
  },
  {
    id: 'musgo', nombre: 'Musgo', descripcion: 'Verdes de bosque con detalles dorados.',
    claro: { bg: '#e9eddf', ink: '#222a1c', ink2: '#4f5a41', accent: '#3d6b2e', 'on-accent': '#ffffff', sage: '#6b5a1e', surface: '#fafcf5', high: '#dde3cf', line: '#c1c9ad', done: '#e4e8c8', 'done-ink': '#4a4a14', btn: '#2c3a20', 'btn-ink': '#ffffff', big: '#222a1c', 'open-bg': '#fafcf5', 'open-ink': '#222a1c', 'open-ring': '#3d6b2e', error: '#a3231b' },
    oscuro: { bg: '#161c13', ink: '#eaf1de', ink2: '#bdc8a8', accent: '#a9d67f', 'on-accent': '#10200a', sage: '#e0c46a', surface: '#1f281b', high: '#2a3524', line: '#3e4b35', done: '#4a4d22', 'done-ink': '#f1efc9', btn: '#a9d67f', 'btn-ink': '#10200a', big: '#eaf1de', 'open-bg': '#eef3e2', 'open-ink': '#161c13', 'open-ring': '#a9d67f', error: '#ff9a8f' },
  },
];
const VISION_PARES = [['ink', 'bg', 4.5], ['ink', 'surface', 4.5], ['ink', 'high', 4.5], ['ink2', 'bg', 4.5], ['ink2', 'surface', 4.5], ['accent', 'bg', 4.5], ['accent', 'surface', 4.5], ['on-accent', 'accent', 4.5], ['btn-ink', 'btn', 4.5], ['done-ink', 'done', 4.5], ['open-ink', 'open-bg', 4.5], ['big', 'bg', 4.5], ['error', 'bg', 4.5], ['sage', 'bg', 3], ['open-ring', 'bg', 3]];

// ───── Pomodoro (tokens --vp-*, de pomodoro/colores.js) ─────
const POMODORO = [
  {
    id: 'citrico', nombre: 'Cítrico', descripcion: 'Naranja quemado y verde lima sobre crema.',
    claro: { bg: '#fbfaf0', surface: '#ffffff', surface2: '#f2f1de', line: '#e3e1c8', ink: '#20220f', ink2: '#55582f', ink3: '#62653a', focus: '#b45309', focusSoft: '#fbe8cf', focusText: '#8f4107', focusInk: '#ffffff', rest: '#4d7c0f', restSoft: '#e6f1cf', restText: '#3b6009', restInk: '#ffffff', danger: '#b3261e' },
    oscuro: { bg: '#15170a', surface: '#1e2110', surface2: '#272b15', line: '#36391e', ink: '#f3f5de', ink2: '#c3c79a', ink3: '#a3a778', focus: '#f59e42', focusSoft: '#3b2a10', focusText: '#f59e42', focusInk: '#1d1005', rest: '#a3d65c', restSoft: '#25330e', restText: '#a3d65c', restInk: '#121c04', danger: '#ff8a80' },
  },
  {
    id: 'grafito', nombre: 'Grafito', descripcion: 'Grises fríos con azul para enfocar y verde azulado para descansar.',
    claro: { bg: '#f4f5f7', surface: '#ffffff', surface2: '#e9ebef', line: '#d5d9e0', ink: '#14171c', ink2: '#444b57', ink3: '#565d6b', focus: '#2f4b8f', focusSoft: '#dde5f7', focusText: '#243c75', focusInk: '#ffffff', rest: '#1f7a6d', restSoft: '#d6efea', restText: '#17594f', restInk: '#ffffff', danger: '#b3261e' },
    oscuro: { bg: '#101216', surface: '#181b21', surface2: '#20242b', line: '#2e333c', ink: '#eef0f4', ink2: '#b7bdc9', ink3: '#9aa1af', focus: '#8fb0f5', focusSoft: '#1c2740', focusText: '#8fb0f5', focusInk: '#0a1226', rest: '#6fd0c0', restSoft: '#14332e', restText: '#6fd0c0', restInk: '#04201b', danger: '#ff8a80' },
  },
];
const POMODORO_PARES = [['ink', 'bg', 4.5], ['ink', 'surface', 4.5], ['ink2', 'surface', 4.5], ['ink2', 'bg', 4.5], ['ink3', 'bg', 4.5], ['ink3', 'surface', 4.5], ['ink3', 'focusSoft', 4.5], ['focusText', 'focusSoft', 4.5], ['restText', 'restSoft', 4.5], ['focusInk', 'focus', 4.5], ['restInk', 'rest', 4.5], ['focusText', 'surface', 4.5], ['restText', 'surface', 4.5], ['danger', 'bg', 4.5]];

// ───── Investigación (tokens --vi-*, de investigacion/colores.js) ─────
const INVESTIGACION = [
  {
    id: 'sepia', nombre: 'Sepia', descripcion: 'Papel cálido y tinta marrón, cómodo para leer mucho rato.',
    claro: { fondo: '#f6efe2', superficie: '#fffaf0', texto: '#2b2216', suave: '#5a4b36', borde: '#7d6b50', enfoque: '#7a3e12', enfoqueSobre: '#ffffff', enfoqueFondo: '#f1dfc8', descanso: '#3d5a3a', descansoSobre: '#ffffff', descansoFondo: '#dfe8d8', anillo: '#dccfb8', foco: '#1b3fbf', aviso: '#6b4a00', avisoFondo: '#fff0c4' },
    oscuro: { fondo: '#1c1610', superficie: '#261e16', texto: '#f2e8d6', suave: '#c9b99c', borde: '#8f7e63', enfoque: '#e0a867', enfoqueSobre: '#1c1005', enfoqueFondo: '#3a2a18', descanso: '#a6c79f', descansoSobre: '#0f1a0d', descansoFondo: '#243222', anillo: '#3a3023', foco: '#9fb7ff', aviso: '#f1d28a', avisoFondo: '#3a2f10' },
  },
  {
    id: 'azul', nombre: 'Azul sobrio', descripcion: 'Azules fríos y violeta en el foco, para trabajar sin distracciones.',
    claro: { fondo: '#f2f5fa', superficie: '#ffffff', texto: '#141c2b', suave: '#44506a', borde: '#6b7894', enfoque: '#1f3f8f', enfoqueSobre: '#ffffff', enfoqueFondo: '#dde6f8', descanso: '#1c6b60', descansoSobre: '#ffffff', descansoFondo: '#d6eeea', anillo: '#d3dae8', foco: '#5b21b6', aviso: '#6b4a00', avisoFondo: '#fff3d1' },
    oscuro: { fondo: '#0f1420', superficie: '#171e2e', texto: '#e8edf8', suave: '#aab6d0', borde: '#7b88a6', enfoque: '#9db8f5', enfoqueSobre: '#0b1530', enfoqueFondo: '#1d2a4a', descanso: '#7fd6c8', descansoSobre: '#04201b', descansoFondo: '#143430', anillo: '#2b3550', foco: '#d0bfff', aviso: '#f1d28a', avisoFondo: '#3a2f10' },
  },
];

// ───── Paridad (roles M3 de theme.css, acotados al contenedor de la visión) ─────
const PARIDAD = [
  {
    id: 'cielo', nombre: 'Cielo y arena', descripcion: 'Azul claro con arena y dorado.',
    claro: juego({ primary: '#1b5f9e', secondary: '#8a5a1f', accent: '#9a6700', tertiary: '#2f7a4a', tertiaryContainer: '#d6efdd', blue: '#2b5f9e', onPrimary: '#ffffff', primaryContainer: '#d6e7f8', onPrimaryContainer: '#0a2540', onSecondary: '#ffffff', secondaryContainer: '#f3e1c8', onSecondaryContainer: '#3a2307', onTertiary: '#ffffff', onTertiaryContainer: '#082a14', background: '#f6f4ee', surface: '#fffefb', onSurface: '#1d2430', variant: '#e8e6dc', onVariant: '#505a68', outline: '#6b7482', outlineVariant: '#d3d6dc', containers: ['#fffefb', '#f9f7f1', '#f3f1ea', '#edebe3', '#e6e4db'] }),
    oscuro: juego({ primary: '#8fc0f0', secondary: '#e3b878', accent: '#f0c060', tertiary: '#7fd39a', tertiaryContainer: '#17452a', blue: '#8fb7ee', onPrimary: '#06223d', primaryContainer: '#12466e', onPrimaryContainer: '#d6e7f8', onSecondary: '#3a2307', secondaryContainer: '#5c3d10', onSecondaryContainer: '#f3e1c8', onTertiary: '#082a14', onTertiaryContainer: '#d6efdd', background: '#10151c', surface: '#171e27', onSurface: '#e8edf5', variant: '#222b36', onVariant: '#b0bac8', outline: '#8893a3', outlineVariant: '#344050', containers: ['#0b0f15', '#131920', '#171e27', '#222b36', '#2c3744'] }),
  },
  {
    id: 'bosque', nombre: 'Bosque y bayas', descripcion: 'Verde bosque con frambuesa.',
    claro: juego({ primary: '#2f6b3a', secondary: '#8c2f4b', accent: '#8a6d00', tertiary: '#2f6b3a', tertiaryContainer: '#d9efdc', blue: '#355f8c', onPrimary: '#ffffff', primaryContainer: '#d9efdc', onPrimaryContainer: '#0b2a12', onSecondary: '#ffffff', secondaryContainer: '#f6d9e2', onSecondaryContainer: '#3a0d1b', onTertiary: '#ffffff', onTertiaryContainer: '#0b2a12', background: '#f2f6ef', surface: '#fcfef9', onSurface: '#1c261e', variant: '#e1e9dd', onVariant: '#475648', outline: '#68786a', outlineVariant: '#cdd8ca', containers: ['#fcfef9', '#f6faf2', '#eff4eb', '#e8efe4', '#e1e9dd'] }),
    oscuro: juego({ primary: '#8fd49a', secondary: '#f0a0b8', accent: '#e8c35a', tertiary: '#8fd49a', tertiaryContainer: '#1c4a26', blue: '#9dbcec', onPrimary: '#082a12', primaryContainer: '#1f5a2c', onPrimaryContainer: '#d9efdc', onSecondary: '#3a0d1b', secondaryContainer: '#6a2038', onSecondaryContainer: '#f6d9e2', onTertiary: '#082a12', onTertiaryContainer: '#d9efdc', background: '#0f1711', surface: '#16201a', onSurface: '#e6f0e8', variant: '#20302a', onVariant: '#afc2b4', outline: '#85998a', outlineVariant: '#334638', containers: ['#0a110c', '#121b15', '#16201a', '#20302a', '#2a3d33'] }),
  },
];

export const VISIONES_CON_PALETAS = Object.freeze({
  calma: { prefijo: '--vc-', paletas: CALMA, base: CALMA_BASE, pares: CALMA_PARES, muestra: ['fondo', 'papel', 'ciruela', 'miel'] },
  vision: { prefijo: '--vv-', paletas: VISION, base: VISION_BASE, pares: VISION_PARES, muestra: ['bg', 'surface', 'accent', 'sage'] },
  pomodoro: { prefijo: '--vp-', paletas: POMODORO, base: null, pares: POMODORO_PARES, muestra: ['bg', 'surface', 'focus', 'rest'] },
  investigacion: { prefijo: '--vi-', paletas: INVESTIGACION, base: null, pares: null, muestra: ['fondo', 'superficie', 'enfoque', 'descanso'] },
  paridad: { prefijo: '--', paletas: PARIDAD, base: null, pares: null, muestra: ['background', 'surface', 'primary', 'secondary'] },
});

export const paletasDe = (visionId) => VISIONES_CON_PALETAS[visionId]?.paletas ?? [];
export const esPaletaDe = (visionId, id) => id === PREDETERMINADA || paletasDe(visionId).some((p) => p.id === id);
export const paletaDeVision = (visionId, id) => paletasDe(visionId).find((p) => p.id === id) ?? null;

/** Variables CSS (nombre completo → valor) de la paleta para el tema pedido; {} si es la predeterminada o no existe. */
export function varsDePaleta(visionId, id, oscuro) {
  const v = VISIONES_CON_PALETAS[visionId];
  const p = paletaDeVision(visionId, id);
  if (!v || !p) return {};
  return Object.fromEntries(Object.entries(oscuro ? p.oscuro : p.claro).map(([k, c]) => [`${v.prefijo}${k}`, c]));
}

/** Colores de la muestra (4) de una paleta en el tema pedido; null para la predeterminada. */
export function muestraDe(visionId, id, oscuro) {
  const v = VISIONES_CON_PALETAS[visionId];
  const p = paletaDeVision(visionId, id);
  if (!v || !p) return null;
  const t = oscuro ? p.oscuro : p.claro;
  return v.muestra.map((k) => t[k]);
}

/** Comprobaciones de contraste de una visión: lista de [texto, fondo, mínimo] y los tokens de cada paleta con su base. */
export function paresDe(visionId) {
  if (visionId === 'paridad') return [...PARES_TEXTO.map(([a, b]) => [a, b, 4.5]), ...PARES_GRAFICOS.map(([a, b]) => [a, b, 3])];
  return VISIONES_CON_PALETAS[visionId]?.pares ?? [];
}

export function problemasDeContraste(visionId, tokens, pares = paresDe(visionId)) {
  const out = [];
  for (const [a, b, min] of pares) {
    const c = contraste(tokens[a], tokens[b]);
    if (c < min) out.push(`${a} sobre ${b} = ${c.toFixed(2)} (mínimo ${min})`);
  }
  return out;
}

export function cargarPaletaVision(storage, visionId) {
  try {
    const id = JSON.parse(storage?.getItem(claveDe(visionId)) ?? 'null')?.id;
    return esPaletaDe(visionId, id) ? id : PREDETERMINADA;
  } catch {
    return PREDETERMINADA;
  }
}

export function guardarPaletaVision(storage, visionId, id) {
  try {
    if (!storage) return;
    if (id === PREDETERMINADA) storage.removeItem(claveDe(visionId));
    else storage.setItem(claveDe(visionId), JSON.stringify({ v: 1, id }));
  } catch { /* sin almacenamiento: la paleta vale solo en esta sesión */ }
}
