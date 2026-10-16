// Paletas de la página principal. Puro y sin DOM salvo `aplicarPaleta`/`cargarPaleta`/`guardarPaleta`, que reciben el
// elemento o el almacenamiento. Cada paleta tiene variante clara y oscura y se suma al claro/oscuro de la app: «base» es
// la paleta original (no pisa nada). Los roles son los de theme.css (Material 3).
export const PALETTE_KEY = 'kairos_pomodoro_palette_v1';

const ROLES_CONTENEDOR = ['surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest'];

// Expande un juego abreviado de colores a todos los roles que usa la app.
export function juego(c) {
  return {
    'pomo-primary': c.primary, 'pomo-primary-dark': c.primaryAlt ?? c.primary, 'pomo-secondary': c.secondary, 'pomo-accent-gold': c.accent,
    'break-green': c.tertiary, 'break-green-dark': c.tertiaryAlt ?? c.tertiary, 'break-green-light': c.tertiaryContainer, 'long-break-blue': c.blue,
    primary: c.primary, 'on-primary': c.onPrimary, 'primary-container': c.primaryContainer, 'on-primary-container': c.onPrimaryContainer,
    secondary: c.secondary, 'on-secondary': c.onSecondary, 'secondary-container': c.secondaryContainer, 'on-secondary-container': c.onSecondaryContainer,
    tertiary: c.tertiary, 'on-tertiary': c.onTertiary, 'tertiary-container': c.tertiaryContainer, 'on-tertiary-container': c.onTertiaryContainer,
    background: c.background, 'on-background': c.onSurface, surface: c.surface, 'on-surface': c.onSurface,
    'surface-variant': c.variant, 'on-surface-variant': c.onVariant, 'surface-tint': c.primary, outline: c.outline, 'outline-variant': c.outlineVariant,
    ...Object.fromEntries(ROLES_CONTENEDOR.map((r, i) => [r, c.containers[i]])),
  };
}

export const PALETAS = Object.freeze([
  { id: 'base', nombre: 'Original', descripcion: 'La paleta de siempre: rojo tomate sobre blanco; en oscuro, azul pizarra.', claro: null, oscuro: null },
  {
    id: 'salvia',
    nombre: 'Salvia y nogal',
    descripcion: 'De Pomodoro visión: salvia y terracota de día, nogal y ámbar de noche.',
    origen: 'pomodoro-vision (theme.css)',
    claro: juego({
      primary: '#923a16', primaryAlt: '#e6a23c', secondary: '#3f5a3c', accent: '#6f5000', tertiary: '#3f5a3c', tertiaryAlt: '#9bbb8e', tertiaryContainer: '#dde7d6', blue: '#46627a',
      onPrimary: '#ffffff', primaryContainer: '#f6d9cc', onPrimaryContainer: '#4a1c0a', onSecondary: '#ffffff', secondaryContainer: '#dde7d6', onSecondaryContainer: '#1f2f1c',
      onTertiary: '#ffffff', onTertiaryContainer: '#1f2f1c', background: '#f1ebdd', surface: '#fffdf7', onSurface: '#2f2a22', variant: '#e9e1cf', onVariant: '#5f5442',
      outline: '#7d725d', outlineVariant: '#d6ccb6', containers: ['#fffdf7', '#f7f1e3', '#f1ebdd', '#ebe3d1', '#e4dcc8'],
    }),
    oscuro: juego({
      primary: '#eeb04a', secondary: '#a6c599', accent: '#eeb04a', tertiary: '#a6c599', tertiaryContainer: '#3c4a36', blue: '#8fb3cc',
      onPrimary: '#2a1a0a', primaryContainer: '#5a3a12', onPrimaryContainer: '#ffe2b0', onSecondary: '#1c2a18', secondaryContainer: '#3c4a36', onSecondaryContainer: '#dff0d6',
      onTertiary: '#1c2a18', onTertiaryContainer: '#dff0d6', background: '#2a211b', surface: '#35291f', onSurface: '#f6ead4', variant: '#3f3329', onVariant: '#cdbda1',
      outline: '#a89979', outlineVariant: '#574838', containers: ['#231b16', '#2f251d', '#35291f', '#3f3329', '#4a3d31'],
    }),
  },
  {
    id: 'oceano',
    nombre: 'Océano y coral',
    descripcion: 'Propuesta: azul petróleo y coral sobre fondos fríos; de noche, celeste sobre azul marino.',
    claro: juego({
      primary: '#0b5c7a', secondary: '#9a3a1a', accent: '#7a5000', tertiary: '#17664b', tertiaryContainer: '#d3efe4', blue: '#2b5f9e',
      onPrimary: '#ffffff', primaryContainer: '#cfeaf5', onPrimaryContainer: '#00222f', onSecondary: '#ffffff', secondaryContainer: '#fadccf', onSecondaryContainer: '#3a1203',
      onTertiary: '#ffffff', onTertiaryContainer: '#04271c', background: '#eef6f9', surface: '#ffffff', onSurface: '#0f2530', variant: '#dcebf1', onVariant: '#41606c',
      outline: '#5f7e8a', outlineVariant: '#bfd4dc', containers: ['#ffffff', '#f4fafc', '#eaf3f7', '#e0edf2', '#d6e6ed'],
    }),
    oscuro: juego({
      primary: '#7cc7e3', secondary: '#ff9b78', accent: '#ffb84d', tertiary: '#6fd1ac', tertiaryContainer: '#14463a', blue: '#8fb7ee',
      onPrimary: '#00212d', primaryContainer: '#0f4358', onPrimaryContainer: '#cfeaf5', onSecondary: '#3a1203', secondaryContainer: '#6a2a12', onSecondaryContainer: '#fadccf',
      onTertiary: '#04271c', onTertiaryContainer: '#d3efe4', background: '#0d1b22', surface: '#14272f', onSurface: '#e6f3f8', variant: '#1c3540', onVariant: '#a9c4cf',
      outline: '#7f9ca8', outlineVariant: '#2f4a56', containers: ['#08141a', '#10222a', '#14272f', '#1c3540', '#25424e'],
    }),
  },
  {
    id: 'ciruela',
    nombre: 'Ciruela y menta',
    descripcion: 'Propuesta: ciruela y menta sobre fondos rosados muy suaves; de noche, orquídea sobre berenjena.',
    claro: juego({
      primary: '#7a3b69', secondary: '#1f6154', accent: '#6f5000', tertiary: '#1f6154', tertiaryContainer: '#d3eee6', blue: '#4a5fa8',
      onPrimary: '#ffffff', primaryContainer: '#f3d8ec', onPrimaryContainer: '#33102b', onSecondary: '#ffffff', secondaryContainer: '#d3eee6', onSecondaryContainer: '#03271f',
      onTertiary: '#ffffff', onTertiaryContainer: '#03271f', background: '#f8f1f6', surface: '#fffafd', onSurface: '#2b1a27', variant: '#eddde8', onVariant: '#5e4559',
      outline: '#7e6578', outlineVariant: '#d8c4d2', containers: ['#fffafd', '#fbf4f9', '#f6edf3', '#f0e5ed', '#e9dde6'],
    }),
    oscuro: juego({
      primary: '#e3a3d3', secondary: '#7fd1bd', accent: '#f0c14d', tertiary: '#7fd1bd', tertiaryContainer: '#17463b', blue: '#a5b4f0',
      onPrimary: '#3a1431', primaryContainer: '#5a2a4d', onPrimaryContainer: '#f3d8ec', onSecondary: '#03271f', secondaryContainer: '#17463b', onSecondaryContainer: '#d3eee6',
      onTertiary: '#03271f', onTertiaryContainer: '#d3eee6', background: '#1f1220', surface: '#2b1a2c', onSurface: '#f6e6f2', variant: '#3a2638', onVariant: '#cfb3c8',
      outline: '#a58aa0', outlineVariant: '#523a50', containers: ['#170c18', '#251626', '#2b1a2c', '#3a2638', '#473246'],
    }),
  },
]);

export const PALETA_INICIAL = 'base';
export const esPaleta = (id) => PALETAS.some((p) => p.id === id);
export const paletaDe = (id) => PALETAS.find((p) => p.id === id) ?? PALETAS[0];

/** Roles de la paleta para el tema pedido; `null` si la paleta no pisa nada (base). */
export const rolesDe = (id, oscuro) => paletaDe(id)[oscuro ? 'oscuro' : 'claro'];

/** Pares texto/fondo (4.5:1) y elementos gráficos (3:1) que se usan en pantalla y deben cumplirse en cada paleta. */
export const PARES_TEXTO = Object.freeze([
  ['on-primary', 'primary'], ['on-secondary', 'secondary'], ['on-tertiary', 'tertiary'],
  ['on-primary-container', 'primary-container'], ['on-secondary-container', 'secondary-container'], ['on-tertiary-container', 'tertiary-container'],
  ['on-background', 'background'], ['on-surface', 'surface'], ['on-surface', 'surface-container-high'],
  ['on-surface-variant', 'surface-variant'], ['on-surface-variant', 'surface'], ['on-surface-variant', 'background'],
  ['primary', 'background'], ['primary', 'surface'], ['secondary', 'surface'],
]);
export const PARES_GRAFICOS = Object.freeze([['outline', 'surface'], ['outline', 'background'], ['pomo-accent-gold', 'surface']]);

const canal = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}
export function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Pone (o quita, en «base») las variables de la paleta en `root` (normalmente <html>). Devuelve los nombres puestos. */
export function aplicarPaleta(root, id, oscuro) {
  const style = root.style;
  for (const p of PALETAS) for (const modo of ['claro', 'oscuro']) for (const k of Object.keys(p[modo] ?? {})) style.removeProperty(`--${k}`);
  const roles = rolesDe(id, oscuro);
  if (!roles) { delete root.dataset.palette; return []; }
  for (const [k, v] of Object.entries(roles)) style.setProperty(`--${k}`, v);
  root.dataset.palette = id;
  return Object.keys(roles);
}

export function cargarPaleta(storage) {
  try {
    const id = JSON.parse(storage?.getItem(PALETTE_KEY) ?? 'null')?.id;
    return esPaleta(id) ? id : PALETA_INICIAL;
  } catch {
    return PALETA_INICIAL;
  }
}

export function guardarPaleta(storage, id) {
  try {
    if (!storage) return;
    if (id === PALETA_INICIAL) storage.removeItem(PALETTE_KEY);
    else storage.setItem(PALETTE_KEY, JSON.stringify({ v: 1, id }));
  } catch { /* sin almacenamiento: la paleta vale solo en esta sesión */ }
}
