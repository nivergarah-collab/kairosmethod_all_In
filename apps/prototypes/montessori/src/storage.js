// Guardado básico en localStorage: todo se valida y sanea al leer, lleva número de
// versión del esquema, y cada acceso va en try/catch (el almacenamiento puede estar
// bloqueado, lleno o ausente). Nada sale del navegador.
import {
  ITEM_TYPES, VIEWS, SIZES, BACKGROUNDS, TEMPLATES, LISTS, LIST_MAX_ITEMS, LIST_TEXT_MAX,
  initialState, sanitizeConfig, clampX, clampY,
} from './state.js';

export const STORAGE_KEY = 'kairos.montessori';
export const SCHEMA_VERSION = 1;
const MAX_ITEMS = 100;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const posInt = (v) => Number.isInteger(v) && v > 0 && v < 1e9;
const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback);

// Parte del estado que se guarda (la sesión en curso y las pausas no se guardan).
export function toSaved(state) {
  return {
    schema: SCHEMA_VERSION,
    workspace: {
      background: state.background,
      template: state.template,
      nextId: state.nextId,
      items: state.items,
    },
    lists: {
      tasks: state.tasks,
      goals: state.goals,
      distractions: state.distractions,
      nextListId: state.nextListId,
    },
  };
}

function cleanItems(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const items = [];
  for (const it of raw.slice(0, MAX_ITEMS)) {
    if (!isObj(it) || !ITEM_TYPES[it.type] || !posInt(it.id) || seen.has(it.id)) continue;
    seen.add(it.id);
    items.push({
      id: it.id,
      type: it.type,
      x: clampX(it.x),
      y: clampY(it.y),
      done: it.done === true,
      view: oneOf(it.view, VIEWS, 'icon'),
      size: oneOf(it.size, SIZES, 'main'),
      config: sanitizeConfig(it.type, isObj(it.config) ? it.config : {}),
    });
  }
  return items;
}

function cleanList(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const e of raw.slice(0, LIST_MAX_ITEMS)) {
    if (!isObj(e) || !posInt(e.id) || seen.has(e.id) || typeof e.text !== 'string') continue;
    const text = e.text.trim().slice(0, LIST_TEXT_MAX);
    if (!text) continue;
    seen.add(e.id);
    out.push({ id: e.id, text, done: e.done === true });
  }
  return out;
}

// Convierte lo leído en un estado válido, o devuelve null si no es utilizable
// (no es objeto, esquema de otra versión o faltan las secciones).
export function sanitizeSaved(raw) {
  if (!isObj(raw) || raw.schema !== SCHEMA_VERSION) return null;
  if (!isObj(raw.workspace) || !isObj(raw.lists)) return null;
  const w = raw.workspace;
  const l = raw.lists;
  const items = cleanItems(w.items);
  const tasks = cleanList(l.tasks);
  const goals = cleanList(l.goals);
  const distractions = cleanList(l.distractions);
  const maxId = (list) => list.reduce((m, e) => Math.max(m, e.id), 0);
  return {
    ...initialState,
    items,
    nextId: Math.max(posInt(w.nextId) ? w.nextId : 1, maxId(items) + 1),
    background: oneOf(w.background, BACKGROUNDS.map((b) => b.id), initialState.background),
    template: oneOf(w.template, TEMPLATES.map((t) => t.id), initialState.template),
    tasks,
    goals,
    distractions,
    nextListId: Math.max(
      posInt(l.nextListId) ? l.nextListId : 1,
      maxId(tasks) + 1, maxId(goals) + 1, maxId(distractions) + 1,
    ),
  };
}

export function loadState(storage) {
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (!text) return null;
    return sanitizeSaved(JSON.parse(text));
  } catch {
    return null; // corrupto o sin acceso: se parte limpio
  }
}

export function saveState(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(toSaved(state)));
    return true;
  } catch {
    return false;
  }
}

export function clearSaved(storage) {
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

// Modelo del espacio de trabajo para descargar (sin tareas, metas ni sesión).
export function workspaceExport(state, now = new Date()) {
  const { workspace } = toSaved(state);
  return {
    schema: SCHEMA_VERSION,
    kind: 'espacio-de-trabajo',
    exportedAt: now.toISOString(),
    background: workspace.background,
    template: workspace.template,
    items: workspace.items,
  };
}

export const IMPORT_MAX_BYTES = 512 * 1024;

// Importa un espacio descargado antes. Validación estricta: tamaño, JSON, tipo y esquema.
// Devuelve { ok: true, workspace } o { ok: false, error } con un mensaje para la persona.
export function parseWorkspaceImport(text) {
  if (typeof text !== 'string' || text.length === 0) return { ok: false, error: 'El archivo está vacío.' };
  if (text.length > IMPORT_MAX_BYTES) return { ok: false, error: 'El archivo es demasiado grande.' };
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  if (!isObj(raw) || raw.kind !== 'espacio-de-trabajo') {
    return { ok: false, error: 'No es un espacio de trabajo exportado por esta app.' };
  }
  if (raw.schema !== SCHEMA_VERSION) return { ok: false, error: 'El archivo es de otra versión y no se puede importar.' };
  if (!Array.isArray(raw.items)) return { ok: false, error: 'Faltan los elementos del espacio.' };
  const clean = sanitizeSaved({
    schema: SCHEMA_VERSION,
    workspace: { background: raw.background, template: raw.template, nextId: 1, items: raw.items },
    lists: {},
  });
  if (!clean) return { ok: false, error: 'No se pudo leer el espacio.' };
  const dropped = raw.items.length - clean.items.length;
  return {
    ok: true,
    dropped,
    workspace: { items: clean.items, nextId: clean.nextId, background: clean.background, template: clean.template },
  };
}
