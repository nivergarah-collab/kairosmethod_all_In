// Contrato común de sesión (v1). Módulo puro: sin DOM, sin reloj propio, sin almacenamiento.
// Todas las visiones (Pomodoro, Calma, Visión, Paridad, Investigación) son solo capas de
// presentación sobre este contrato: leen el estado, envían acciones y muestran el extracto.
// El resultado guardado NUNCA incluye qué visión se usó (ver toSavedRecord).

export const CONTRACT_VERSION = 1;

export const Phase = {
  FOCUS: 'FOCUS',
  SHORT_BREAK: 'SHORT_BREAK',
  LONG_BREAK: 'LONG_BREAK',
};

/** Claves de alerta que el contrato emite como eventos; la capa de presentación decide cómo sonar o vibrar. */
export const EventKind = {
  ALERT: 'alert',
  HAPTIC: 'haptic',
};

/** Acciones que toda visión debe poder enviar. Cualquier otra se ignora (la sesión no cambia). */
export const ActionType = {
  TICK: 'tick',
  TOGGLE_PLAY: 'togglePlay',
  PAUSE: 'pause',
  RESUME: 'resume',
  ADD_MINUTES: 'addMinutes',
  TOGGLE_BLOCK: 'toggleBlock',
  COMPLETE_CURRENT: 'completeCurrent',
  SKIP_PHASE: 'skipPhase',
  RESTART_PHASE: 'restartPhase',
  FINISH: 'finish',
};

const int = (v, min, fallback) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n >= min ? n : fallback;
};

/** Normaliza la configuración de una sesión (textos recortados, números enteros válidos). */
export function normalizeConfig(cfg = {}) {
  const topic = String(cfg.topic ?? '').trim();
  const subtopic = String(cfg.subtopic ?? '').trim();
  return {
    topic: topic === '' ? 'Tema General' : topic,
    subtopic: subtopic === '' ? 'Sesión de Enfoque' : subtopic,
    subtopicEmpty: subtopic === '',
    blocksCount: int(cfg.blocksCount, 1, 4),
    workMinutes: int(cfg.workMinutes, 1, 25),
    // Un descanso de 0 min significa «sin descanso corto». El largo se controla con longBreakEvery.
    shortBreakMinutes: int(cfg.shortBreakMinutes, 0, 5),
    longBreakMinutes: int(cfg.longBreakMinutes, 0, 15),
    // Cada cuántos bloques hay descanso largo. 0 = nunca hay descanso largo.
    longBreakEvery: Math.min(int(cfg.longBreakEvery, 0, 4), 12),
    blockGoals: { ...(cfg.blockGoals ?? {}) },
  };
}

/** Crea una sesión recién iniciada (corriendo, bloque 1, fase de enfoque). */
export function createSession(rawConfig, nowMs) {
  const config = normalizeConfig(rawConfig);
  const blocks = Array.from({ length: config.blocksCount }, (_, k) => {
    const index = k + 1;
    const custom = String(config.blockGoals[index] ?? '');
    return {
      index,
      title: `Bloque ${index}`,
      goal: custom.trim() !== '' ? custom : `${config.topic}: ${config.subtopic}`,
      durationMinutes: config.workMinutes,
      isCompleted: false,
      completedAt: null,
    };
  });
  const seconds = config.workMinutes * 60;
  return {
    version: CONTRACT_VERSION,
    config,
    phase: Phase.FOCUS,
    blockIndex: 1,
    secondsRemaining: seconds,
    phaseTotalSeconds: seconds,
    running: true,
    finished: false,
    blocks,
    focusSeconds: 0,
    breakSeconds: 0,
    startTime: nowMs,
  };
}

/**
 * Descanso que sigue al bloque `blockIndex` (sin mirar si es el último): { phase, minutes } o null si no hay.
 * Toca descanso largo cada `longBreakEvery` bloques (0 = nunca); si el largo dura 0 min, se usa el corto.
 * Un descanso de 0 min equivale a no tenerlo.
 */
export function breakAfter(config, blockIndex) {
  const every = config.longBreakEvery ?? 4;
  if (every > 0 && blockIndex % every === 0 && config.longBreakMinutes > 0) return { phase: Phase.LONG_BREAK, minutes: config.longBreakMinutes };
  if (config.shortBreakMinutes > 0) return { phase: Phase.SHORT_BREAK, minutes: config.shortBreakMinutes };
  return null;
}

/** Horas de la sesión planeada: estudio efectivo y total (estudio + descansos), en minutos. */
export function planTotals(config) {
  const n = Math.max(0, config.blocksCount);
  let breaks = 0;
  for (let i = 1; i < n; i++) breaks += breakAfter(config, i)?.minutes ?? 0;
  const study = n * config.workMinutes;
  return { studyMinutes: study, breakMinutes: breaks, totalMinutes: study + breaks };
}

const alert = (type) => ({ kind: EventKind.ALERT, type });

function completeBlock(blocks, index, nowMs) {
  return blocks.map((b) => (b.index === index && !b.isCompleted ? { ...b, isCompleted: true, completedAt: nowMs } : b));
}

function finish(session) {
  return { ...session, running: false, finished: true };
}

function completePhase(session, nowMs) {
  const total = session.blocks.length;
  const { config } = session;
  if (session.phase === Phase.FOCUS) {
    const blocks = completeBlock(session.blocks, session.blockIndex, nowMs);
    if (session.blockIndex >= total) {
      return { session: finish({ ...session, blocks }), events: [alert('SESSION_COMPLETE')] };
    }
    const rest = breakAfter(config, session.blockIndex);
    if (!rest) {
      // Sin descanso: pasa directo al siguiente bloque.
      const seconds = config.workMinutes * 60;
      return {
        session: { ...session, blocks, blockIndex: session.blockIndex + 1, phase: Phase.FOCUS, secondsRemaining: seconds, phaseTotalSeconds: seconds },
        events: [alert('BLOCK_BEGINS')],
      };
    }
    const seconds = rest.minutes * 60;
    return {
      session: { ...session, blocks, phase: rest.phase, secondsRemaining: seconds, phaseTotalSeconds: seconds },
      events: [alert('BLOCK_ENDS')],
    };
  }
  const next = session.blockIndex + 1;
  if (next <= total) {
    const seconds = config.workMinutes * 60;
    return {
      session: { ...session, blockIndex: next, phase: Phase.FOCUS, secondsRemaining: seconds, phaseTotalSeconds: seconds },
      events: [alert('BLOCK_BEGINS')],
    };
  }
  return { session: finish(session), events: [alert('SESSION_COMPLETE')] };
}

/**
 * Aplica una acción y devuelve { session, events }. Nunca modifica la sesión recibida.
 * Una sesión terminada (finished) solo acepta TOGGLE_BLOCK; el resto se ignora.
 * Una sesión de solo lectura (readOnly, reabierta desde un registro guardado) no acepta ninguna acción.
 */
export function reduceSession(session, action, nowMs = 0) {
  const same = { session, events: [] };
  if (!session || !action) return same;
  if (session.readOnly) return same;
  switch (action.type) {
    case ActionType.TICK: {
      if (!session.running || session.finished) return same;
      // Igual que el APK: un tick con 0 s restantes cierra la fase; con más, resta un segundo.
      if (session.secondsRemaining > 0) {
        const focus = session.phase === Phase.FOCUS;
        return {
          session: {
            ...session,
            secondsRemaining: session.secondsRemaining - 1,
            focusSeconds: session.focusSeconds + (focus ? 1 : 0),
            breakSeconds: session.breakSeconds + (focus ? 0 : 1),
          },
          events: [],
        };
      }
      return completePhase(session, nowMs);
    }
    case ActionType.TOGGLE_PLAY:
      if (session.finished) return same;
      return { session: { ...session, running: !session.running }, events: [] };
    case ActionType.PAUSE:
      return session.running ? { session: { ...session, running: false }, events: [] } : same;
    case ActionType.RESUME:
      return !session.running && !session.finished ? { session: { ...session, running: true }, events: [] } : same;
    case ActionType.ADD_MINUTES: {
      const minutes = Math.trunc(Number(action.minutes));
      if (session.finished || !Number.isFinite(minutes) || minutes === 0) return same;
      const extra = minutes * 60;
      return {
        session: {
          ...session,
          secondsRemaining: Math.max(0, session.secondsRemaining + extra),
          phaseTotalSeconds: Math.max(1, session.phaseTotalSeconds + extra),
        },
        events: [],
      };
    }
    case ActionType.TOGGLE_BLOCK: {
      if (!session.blocks.some((b) => b.index === action.index)) return same;
      const blocks = session.blocks.map((b) => {
        if (b.index !== action.index) return b;
        const done = !b.isCompleted;
        return { ...b, isCompleted: done, completedAt: done ? nowMs : null };
      });
      return { session: { ...session, blocks }, events: [{ kind: EventKind.HAPTIC }] };
    }
    case ActionType.COMPLETE_CURRENT:
      return reduceSession(session, { type: ActionType.TOGGLE_BLOCK, index: session.blockIndex }, nowMs);
    case ActionType.SKIP_PHASE:
      return session.finished ? same : completePhase(session, nowMs);
    case ActionType.RESTART_PHASE:
      // Vuelve la fase actual a su duración total (incluye los minutos agregados); no cambia de fase.
      return session.finished ? same : { session: { ...session, secondsRemaining: session.phaseTotalSeconds }, events: [] };
    case ActionType.FINISH:
      return session.finished ? same : { session: finish(session), events: [] };
    default:
      return same;
  }
}

/** Extracto/resultado de la sesión: lo que toda visión muestra al terminar y lo que se guarda. */
export function extractSession(session) {
  const planned = session.blocks.length;
  const completed = session.blocks.filter((b) => b.isCompleted).length;
  return {
    topic: session.config.topic,
    subtopic: session.config.subtopicEmpty ? 'Sesión de Estudio' : session.config.subtopic,
    totalBlocksPlanned: planned,
    blocksCompleted: completed,
    focusSeconds: session.focusSeconds,
    breakSeconds: session.breakSeconds,
    completionRate: planned > 0 ? completed / planned : 1,
    satisfactionRating: 5,
    notes: '',
  };
}

/**
 * Registro guardable. NO incluye la visión usada: así cualquier sesión se puede reabrir con
 * cualquier visión. Devuelve { session, blocks } con sessionId pendiente (lo asigna la base).
 */
export function toSavedRecord(session, { userId, notes = '', rating = 5, endTime }) {
  const summary = extractSession(session);
  return {
    session: {
      userId,
      topic: summary.topic,
      subtopic: summary.subtopic,
      totalBlocksPlanned: summary.totalBlocksPlanned,
      blocksCompleted: summary.blocksCompleted,
      workDurationMinutes: session.config.workMinutes,
      shortBreakMinutes: session.config.shortBreakMinutes,
      longBreakMinutes: session.config.longBreakMinutes,
      longBreakEvery: session.config.longBreakEvery,
      totalFocusSecondsSpent: summary.focusSeconds,
      totalBreakSecondsSpent: summary.breakSeconds,
      startTime: session.startTime,
      endTime,
      isCompleted: summary.blocksCompleted >= summary.totalBlocksPlanned,
      notes,
      satisfactionRating: rating,
    },
    blocks: session.blocks.map((b) => ({
      sessionId: 0,
      blockIndex: b.index,
      title: b.title,
      goal: b.goal,
      durationMinutes: b.durationMinutes,
      isCompleted: b.isCompleted,
      completedAt: b.completedAt,
    })),
  };
}

/**
 * Reconstruye una sesión terminada, de solo lectura, desde un registro guardado y sus bloques,
 * para reabrirla con cualquier visión (mismo selector). No reanuda el temporizador.
 */
export function fromSavedRecord(saved, blocks = []) {
  const ordered = [...blocks].sort((a, b) => a.blockIndex - b.blockIndex);
  return {
    version: CONTRACT_VERSION,
    readOnly: true,
    config: normalizeConfig({
      topic: saved.topic,
      subtopic: saved.subtopic,
      blocksCount: saved.totalBlocksPlanned,
      workMinutes: saved.workDurationMinutes,
      shortBreakMinutes: saved.shortBreakMinutes,
      longBreakMinutes: saved.longBreakMinutes,
      longBreakEvery: saved.longBreakEvery, // los registros antiguos no lo traen: se usa el valor por defecto (4)
    }),
    phase: Phase.FOCUS,
    blockIndex: Math.max(1, ordered.length),
    secondsRemaining: 0,
    phaseTotalSeconds: Math.max(1, saved.workDurationMinutes * 60),
    running: false,
    finished: true,
    blocks: ordered.map((b) => ({
      index: b.blockIndex,
      title: b.title,
      goal: b.goal,
      durationMinutes: b.durationMinutes,
      isCompleted: b.isCompleted,
      completedAt: b.completedAt,
    })),
    focusSeconds: saved.totalFocusSecondsSpent,
    breakSeconds: saved.totalBreakSecondsSpent,
    startTime: saved.startTime,
  };
}
