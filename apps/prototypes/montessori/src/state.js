// Lógica pura del prototipo Montessori (sin React). Todo lo que decide algo vive aquí
// para poder probarlo con `node --test`.

export const FILE_KINDS = ['PDF', 'Apuntes', 'Libro', 'Presentación', 'Otro'];
export const DEVICES = ['PC', 'Celular', 'Tablet'];
export const DEVICE_ROLES = ['Estudiar', 'Consultar', 'Música', 'Silencio'];
export const MOODS = ['Instrumental', 'Naturaleza', 'Lo-fi', 'Silencio'];

// Vistas de un elemento (independientes del tamaño): icono → con nombre → en uso.
export const VIEWS = ['icon', 'named', 'live'];
export const VIEW_LABELS = { icon: 'Icono', named: 'Con nombre', live: 'En uso' };
// Tamaño: principal (grande) o secundario (pequeño).
export const SIZES = ['main', 'side'];
export const SIZE_LABELS = { main: 'Principal', side: 'Secundario' };

export const BACKGROUNDS = [
  { id: 'wood', label: 'Madera clara' },
  { id: 'dark', label: 'Escritorio oscuro' },
  { id: 'monitor', label: 'Pantalla' },
];
export const TEMPLATES = [
  { id: 'screen', label: 'Escritorio de pantalla' },
  { id: 'table', label: 'Mesa de estudio' },
];

export const ITEM_TYPES = {
  file: { label: 'Archivo de estudio', icon: '📄', defaults: { name: '', kind: 'PDF' } },
  timer: { label: 'Temporizador', icon: '⏳', defaults: { minutes: 25 } },
  notes: { label: 'Sector de notas', icon: '📝', defaults: { title: 'Notas', text: '' } },
  device: { label: 'Dispositivo', icon: '💻', defaults: { device: 'PC', role: 'Estudiar' } },
  music: { label: 'Música', icon: '🎧', defaults: { mood: 'Instrumental', playlist: '' } },
  lamp: { label: 'Lámpara', icon: '💡', defaults: { on: false } },
  water: { label: 'Agua', icon: '💧', defaults: { filled: false } },
};

const DEVICE_ICONS = { PC: '🖥️', Celular: '📱', Tablet: '📲' };
export const deviceIcon = (device) => DEVICE_ICONS[device] ?? '💻';
export const itemIcon = (item) =>
  item.type === 'device' ? deviceIcon(item.config.device) : ITEM_TYPES[item.type].icon;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback);

// La posición es el CENTRO del elemento, en % del escritorio. La vista además lo
// mantiene dentro de los bordes con CSS, así que aquí solo se acota a un rango sano.
const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 50);
export const clampX = (v) => clamp(toNumber(v), 4, 96);
export const clampY = (v) => clamp(toNumber(v), 6, 94);

// Normaliza una configuración: nunca confía en lo que llega del formulario.
export function sanitizeConfig(type, config = {}) {
  const def = ITEM_TYPES[type];
  if (!def) return {};
  const c = { ...def.defaults, ...config };
  switch (type) {
    case 'file':
      return { name: text(c.name, 60), kind: oneOf(c.kind, FILE_KINDS, 'PDF') };
    case 'timer': {
      const m = Math.round(Number(c.minutes));
      return { minutes: Number.isFinite(m) ? clamp(m, 1, 120) : 25 };
    }
    case 'notes':
      return { title: text(c.title, 40), text: text(c.text, 500) };
    case 'device':
      return {
        device: oneOf(c.device, DEVICES, 'PC'),
        role: oneOf(c.role, DEVICE_ROLES, 'Estudiar'),
      };
    case 'music':
      return { mood: oneOf(c.mood, MOODS, 'Instrumental'), playlist: text(c.playlist, 60) };
    case 'lamp':
      return { on: c.on === true };
    case 'water':
      return { filled: c.filled === true };
    default:
      return {};
  }
}

export const itemTitle = (item) => {
  const c = item.config;
  if (item.type === 'notes' && c.title) return c.title;
  if (item.type === 'file' && c.name) return c.name;
  return ITEM_TYPES[item.type].label;
};

// Línea corta de la vista «con nombre». `timer` trae el tiempo vivo del temporizador.
export function shortLine(item, timer = null) {
  const c = item.config;
  switch (item.type) {
    case 'file':
      return c.name ? c.kind : `${c.kind} · sin nombre`;
    case 'timer': {
      const left = timer ? timer.left : c.minutes * 60;
      return `${formatClock(left)}${timer && timer.running ? ' · en marcha' : ''}`;
    }
    case 'notes':
      return c.text ? c.text : 'Sin notas todavía';
    case 'device':
      return `${c.device} · ${c.role}`;
    case 'music':
      return c.playlist || c.mood;
    case 'lamp':
      return c.on ? 'Encendida' : 'Apagada';
    case 'water':
      return c.filled ? 'Vaso lleno' : 'Vaso vacío';
    default:
      return '';
  }
}

// 75 → «01:15»; 3725 → «1:02:05». Valores inválidos o negativos dan «00:00».
export function formatClock(totalSeconds) {
  const t = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function getProgress(items) {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    ready: total > 0 && done === total,
  };
}

// ---------- Herramientas de la sesión ----------
export const LISTS = ['tasks', 'goals', 'distractions'];
export const LIST_MAX_ITEMS = 50;
export const LIST_TEXT_MAX = 120;

export const PAUSES = [
  { id: 'rest', label: 'Descanso', icon: '☕', msg: 'Hora de un descanso corto: levántate y mira a lo lejos.' },
  { id: 'water', label: 'Agua', icon: '💧', msg: 'Toma un poco de agua.' },
  { id: 'stretch', label: 'Estiramiento', icon: '🧘', msg: 'Estira cuello, hombros y espalda por un minuto.' },
];
export const PAUSE_OPTIONS = [0, 15, 30, 45, 60]; // minutos; 0 = apagado

const freshPauses = () => Object.fromEntries(PAUSES.map((p) => [p.id, { every: 0, ack: 0 }]));

// Pausas vencidas según el tiempo de sesión: solo recordatorio visual, sin sonido.
export function duePauses(pauses, elapsedSeconds) {
  return PAUSES.filter(({ id }) => {
    const p = pauses[id];
    if (!p || p.every <= 0) return false;
    return Math.floor(elapsedSeconds / (p.every * 60)) > p.ack;
  }).map((p) => p.id);
}

export const initialState = {
  items: [],
  nextId: 1,
  background: 'wood',
  template: 'screen',
  phase: 'prep', // 'prep' (preparación) o 'session' (sesión de estudio)
  tasks: [],
  goals: [],
  distractions: [],
  nextListId: 1,
  pauses: freshPauses(),
};

// Resumen de la sesión que termina (se muestra y se puede descargar como JSON).
export function buildSummary(state, elapsedSeconds, now = new Date()) {
  const countDone = (list) => list.filter((e) => e.done).length;
  return {
    schema: 1,
    kind: 'resumen-de-sesion',
    finishedAt: now.toISOString(),
    durationSeconds: Math.max(0, Math.floor(elapsedSeconds) || 0),
    tasks: { done: countDone(state.tasks), total: state.tasks.length, items: state.tasks.map(({ text, done }) => ({ text, done })) },
    goals: { done: countDone(state.goals), total: state.goals.length, items: state.goals.map(({ text, done }) => ({ text, done })) },
    notes: state.items
      .filter((i) => i.type === 'notes' && i.config.text.trim())
      .map((i) => ({ title: i.config.title, text: i.config.text })),
    distractions: state.distractions.map((d) => d.text),
  };
}

function makeItem(state, type, x, y) {
  return {
    id: state.nextId,
    type,
    x: clampX(x),
    y: clampY(y),
    done: false,
    view: 'icon',
    size: 'main',
    config: sanitizeConfig(type, {}),
  };
}

// [tipo, x, y, vista, tamaño, configuración]
export const SAMPLE = [
  ['file', 14, 16, 'named', 'side', { name: 'Apuntes de Cálculo', kind: 'Apuntes' }],
  ['timer', 30, 38, 'live', 'main', { minutes: 25 }],
  ['notes', 74, 36, 'live', 'main', { title: 'Dudas', text: 'Repasar derivadas' }],
  ['device', 87, 18, 'icon', 'main', { device: 'Celular', role: 'Silencio' }],
  ['music', 26, 74, 'named', 'main', { mood: 'Lo-fi', playlist: 'Lo-fi para estudiar' }],
  ['lamp', 88, 62, 'live', 'side', { on: true }],
  ['water', 61, 74, 'live', 'side', { filled: true }],
];

const mapItem = (state, id, fn) => ({
  ...state,
  items: state.items.map((i) => (i.id === id ? fn(i) : i)),
});

export function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      if (!ITEM_TYPES[action.itemType]) return state;
      const item = makeItem(state, action.itemType, action.x ?? 50, action.y ?? 50);
      return { ...state, items: [...state.items, item], nextId: state.nextId + 1 };
    }
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case 'toggle':
      return mapItem(state, action.id, (i) => ({ ...i, done: !i.done }));
    case 'config':
      return mapItem(state, action.id, (i) => ({
        ...i,
        config: sanitizeConfig(i.type, { ...i.config, ...action.patch }),
      }));
    case 'move':
      return mapItem(state, action.id, (i) => ({
        ...i,
        x: clampX(action.x),
        y: clampY(action.y),
      }));
    case 'setView':
      return mapItem(state, action.id, (i) => ({ ...i, view: oneOf(action.view, VIEWS, i.view) }));
    case 'cycleView':
      return mapItem(state, action.id, (i) => ({
        ...i,
        view: VIEWS[(VIEWS.indexOf(i.view) + 1) % VIEWS.length],
      }));
    case 'toggleSize':
      return mapItem(state, action.id, (i) => ({ ...i, size: i.size === 'main' ? 'side' : 'main' }));
    case 'setBackground':
      return BACKGROUNDS.some((b) => b.id === action.background)
        ? { ...state, background: action.background }
        : state;
    case 'setTemplate':
      return TEMPLATES.some((t) => t.id === action.template)
        ? { ...state, template: action.template }
        : state;
    case 'clear':
      return { ...state, items: [] };
    case 'reset':
      return initialState;
    case 'importWorkspace': {
      const w = action.workspace;
      if (!w) return state;
      return { ...state, items: w.items, nextId: Math.max(state.nextId, w.nextId), background: w.background, template: w.template };
    }
    case 'applyExample': {
      // Reemplaza el escritorio; las tareas y metas del ejemplo se suman solo si esas listas están vacías.
      const { workspace: w, goals = [], tasks = [] } = action.payload ?? {};
      if (!w) return state;
      let next = state.nextListId;
      const fill = (list, texts) =>
        list.length > 0 ? list : texts.slice(0, LIST_MAX_ITEMS).map((t) => ({ id: next++, text: t.slice(0, LIST_TEXT_MAX), done: false }));
      const tasksOut = fill(state.tasks, tasks);
      const goalsOut = fill(state.goals, goals);
      return {
        ...state, items: w.items, nextId: Math.max(state.nextId, w.nextId), background: w.background,
        template: w.template, tasks: tasksOut, goals: goalsOut, nextListId: next,
      };
    }
    case 'hydrate':
      return action.state ?? state;
    case 'startSession':
      return {
        ...state,
        phase: 'session',
        pauses: freshPauses(),
      };
    case 'endSession':
      // El escritorio queda guardado; la lista de tareas y las metas se limpian.
      return { ...state, phase: 'prep', tasks: [], goals: [], pauses: freshPauses() };
    case 'listAdd': {
      if (!LISTS.includes(action.list)) return state;
      const t = typeof action.text === 'string' ? action.text.trim().slice(0, LIST_TEXT_MAX) : '';
      if (!t || state[action.list].length >= LIST_MAX_ITEMS) return state;
      return {
        ...state,
        [action.list]: [...state[action.list], { id: state.nextListId, text: t, done: false }],
        nextListId: state.nextListId + 1,
      };
    }
    case 'listToggle':
      if (!LISTS.includes(action.list)) return state;
      return {
        ...state,
        [action.list]: state[action.list].map((e) => (e.id === action.id ? { ...e, done: !e.done } : e)),
      };
    case 'listRemove':
      if (!LISTS.includes(action.list)) return state;
      return { ...state, [action.list]: state[action.list].filter((e) => e.id !== action.id) };
    case 'pauseEvery': {
      if (!state.pauses[action.id] || !PAUSE_OPTIONS.includes(action.every)) return state;
      const ack = action.every > 0 ? Math.floor((action.elapsed || 0) / (action.every * 60)) : 0;
      return { ...state, pauses: { ...state.pauses, [action.id]: { every: action.every, ack } } };
    }
    case 'pauseAck': {
      const p = state.pauses[action.id];
      if (!p || p.every <= 0) return state;
      return {
        ...state,
        pauses: { ...state.pauses, [action.id]: { ...p, ack: Math.floor((action.elapsed || 0) / (p.every * 60)) } },
      };
    }
    case 'load': {
      let next = state.nextId;
      const items = SAMPLE.map(([type, x, y, view, size, config]) => ({
        id: next++,
        type,
        x,
        y,
        done: false,
        view,
        size,
        config: sanitizeConfig(type, config),
      }));
      return { ...state, items, nextId: next };
    }
    default:
      return state;
  }
}
