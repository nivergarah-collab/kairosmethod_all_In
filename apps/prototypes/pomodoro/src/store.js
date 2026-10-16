// Port de MainViewModel.kt + StudyRepository.kt: mismo estado, mismas acciones y mismas reglas.
// Sin dependencias del navegador: la base de datos, las alertas y el reloj se inyectan (así se prueba en Node).
// La lógica de la sesión (fases, bloques, resumen y registro guardable) vive en el contrato común
// `session/contract.js`; este store solo la conecta con la base, las alertas y el reloj.
import { ActionType, EventKind, createSession, extractSession, fromSavedRecord, reduceSession, toSavedRecord } from './session/contract.js';
import { PALETA_INICIAL, esPaleta } from './palettes.js';
import { addUserTopic, removeUserTopic } from './userTopics.js';
import { normalizeProfileName } from './profileName.js';

export const TimerPhase = {
  FOCUS: 'FOCUS',
  SHORT_BREAK: 'SHORT_BREAK',
  LONG_BREAK: 'LONG_BREAK',
  FINISHED: 'FINISHED',
};
export const phaseDisplayName = {
  FOCUS: 'Enfoque',
  SHORT_BREAK: 'Descanso Corto',
  LONG_BREAK: 'Descanso Largo',
  FINISHED: 'Completado',
};

export const AlertType = {
  BLOCK_BEGINS: { key: 'BLOCK_BEGINS', title: 'Inicio de Bloque', description: 'El bloque de estudio ha comenzado' },
  BLOCK_ENDS: { key: 'BLOCK_ENDS', title: 'Fin de Bloque', description: 'Tiempo de estudio terminado' },
  BREAK_BEGINS: { key: 'BREAK_BEGINS', title: 'Inicio de Descanso', description: 'Momento de relajarse' },
  BREAK_ENDS: { key: 'BREAK_ENDS', title: 'Fin de Descanso', description: 'Hora de volver al enfoque' },
  SESSION_COMPLETE: { key: 'SESSION_COMPLETE', title: 'Sesión Completada', description: '¡Todos los bloques terminados!' },
};

// StudyPreset (MainViewModel.presets)
export const presets = [
  { name: 'Clásico Pomodoro', description: '25 min estudio / 5 min descanso', blocks: 4, workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 4 },
  { name: 'Deep Work Intensivo', description: '50 min estudio / 10 min descanso', blocks: 3, workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20, longBreakEvery: 4 },
  { name: 'Sprint Rápido', description: '15 min estudio / 3 min descanso', blocks: 4, workMinutes: 15, shortBreakMinutes: 3, longBreakMinutes: 10, longBreakEvery: 4 },
  { name: 'Maratón de Estudio', description: '45 min estudio / 15 min descanso', blocks: 6, workMinutes: 45, shortBreakMinutes: 15, longBreakMinutes: 25, longBreakEvery: 4 },
];

const CONFIG_STATE_KEYS = Object.freeze({
  topic: 'configTopic',
  subtopic: 'configSubtopic',
  blocksCount: 'configBlocksCount',
  workMinutes: 'configWorkMinutes',
  shortBreakMinutes: 'configShortBreakMinutes',
  longBreakMinutes: 'configLongBreakMinutes',
  longBreakEvery: 'configLongBreakEvery',
  blockGoals: 'configBlockGoals',
});

/** Clave de la base local. Es la misma de siempre: quien ya usaba Pomodoro conserva su historial. */
export const DATABASE_KEY = 'pomostudy_database.v1';

/** Reemplazo de Room (AppDatabase "pomostudy_database"): tablas user_profiles, study_sessions, study_blocks. */
export function createDatabase(storage = null, key = DATABASE_KEY) {
  let data = { users: [], sessions: [], blocks: [], seq: { users: 0, sessions: 0, blocks: 0 } };
  try {
    const raw = storage?.getItem(key);
    if (raw) data = { ...data, ...JSON.parse(raw) };
  } catch {
    /* base ilegible: se empieza vacía, como fallbackToDestructiveMigration */
  }
  let namesMigrated = false;
  if (Array.isArray(data.users)) {
    data.users = data.users.map((user) => {
      if (!user || typeof user !== 'object') return user;
      const name = normalizeProfileName(user.name);
      if (name !== user.name) namesMigrated = true;
      return { ...user, name };
    });
  }
  const save = () => {
    try {
      storage?.setItem(key, JSON.stringify(data));
    } catch {
      /* sin almacenamiento: queda en memoria */
    }
  };
  if (namesMigrated) save();
  const next = (t) => ++data.seq[t];
  return {
    allUsers: () => [...data.users].sort((a, b) => a.id - b.id),
    insertUser(u) {
      const id = u.id ? u.id : next('users');
      data.users = data.users.filter((x) => x.id !== id).concat({ ...u, name: normalizeProfileName(u.name), id });
      save();
      return id;
    },
    updateUser(u) {
      data.users = data.users.map((x) => (x.id === u.id ? { ...u, name: normalizeProfileName(u.name) } : x));
      save();
    },
    deleteUser(u) {
      data.users = data.users.filter((x) => x.id !== u.id);
      const ids = data.sessions.filter((s) => s.userId === u.id).map((s) => s.id);
      data.sessions = data.sessions.filter((s) => s.userId !== u.id);
      data.blocks = data.blocks.filter((b) => !ids.includes(b.sessionId));
      save();
    },
    sessionsForUser: (userId) => data.sessions.filter((s) => s.userId === userId).sort((a, b) => b.endTime - a.endTime),
    insertSession(s) {
      const id = next('sessions');
      data.sessions = data.sessions.concat({ ...s, id });
      save();
      return id;
    },
    insertBlocks(list) {
      data.blocks = data.blocks.concat(list.map((b) => ({ ...b, id: next('blocks') })));
      save();
    },
    blocksForSession: (sessionId) => data.blocks.filter((b) => b.sessionId === sessionId).sort((a, b) => a.blockIndex - b.blockIndex),
    deleteSessionById(sessionId) {
      data.sessions = data.sessions.filter((s) => s.id !== sessionId);
      data.blocks = data.blocks.filter((b) => b.sessionId !== sessionId);
      save();
    },
  };
}

export function createStore({ db = createDatabase(), alerts = { triggerAlert() {}, vibrateFeedback() {} }, now = () => Date.now(), schedule = setTimeout, cancel = clearTimeout } = {}) {
  let session = null; // sesión del contrato común (null si no hay una en curso)
  let sessionSequence = 0;
  let activeSessionId = null;
  let awaitingSessionStart = false;
  let timerHandle = null;
  let timerToken = 0;

  let state = {
    soundAlertsEnabled: true,
    vibrationAlertsEnabled: true,
    isDarkTheme: null, // null = seguir al sistema
    palette: PALETA_INICIAL, // paleta de la página principal (palettes.js)
    allUsers: [],
    activeUser: null,
    userSessions: [],
    // Configuración (valores iniciales del ViewModel)
    configTopic: 'Programación Kotlin',
    configSubtopic: 'Corrutinas y Flow',
    configBlocksCount: 4,
    configWorkMinutes: 25,
    configShortBreakMinutes: 5,
    configLongBreakMinutes: 15,
    configLongBreakEvery: 4,
    configBlockGoals: {},
    // Sesión activa
    isSessionActive: false,
    isReviewing: false, // true: se está viendo una sesión guardada (solo lectura)
    isAwaitingSessionStart: false,
    activeConfig: null, // configuración de la sesión en curso o en revisión (no la del formulario de Configurar)
    currentPhase: TimerPhase.FOCUS,
    currentBlockIndex: 1,
    secondsRemaining: 25 * 60,
    phaseTotalSeconds: 25 * 60,
    isTimerRunning: false,
    activeBlocks: [],
    showSummaryDialog: false,
    lastSummary: null,
    currentTab: 0, // 0 = Configurar, 1 = Temporizador, 2 = Estadísticas
  };
  const listeners = new Set();
  const set = (patch) => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    listeners.forEach((l) => l());
  };

  // --- Repositorio -------------------------------------------------------------------------
  const refreshUsersAndSessions = () => {
    const list = db.allUsers();
    let active = state.activeUser;
    if (list.length === 0) {
      // ensureDefaultUser()
      const defaultUser = { id: 0, name: 'Estudiante Focus', colorHex: '#E04F36', dailyGoalMinutes: 100, avatarEmoji: '🚀', createdAt: now() };
      const id = db.insertUser({ ...defaultUser, id: 0 });
      active = { ...defaultUser, id };
      set({ allUsers: db.allUsers(), activeUser: active, userSessions: db.sessionsForUser(active.id) });
      return;
    }
    if (active == null || list.every((u) => u.id !== active.id)) active = list[0];
    set({ allUsers: list, activeUser: active, userSessions: db.sessionsForUser(active.id) });
  };
  const refreshSessions = () => set((s) => ({ userSessions: s.activeUser ? db.sessionsForUser(s.activeUser.id) : [] }));

  // --- Alertas -----------------------------------------------------------------------------
  const alertNow = (type) => alerts.triggerAlert(type, state.soundAlertsEnabled, state.vibrationAlertsEnabled);

  // --- Temporizador ------------------------------------------------------------------------
  const stopTicker = () => {
    timerToken++;
    if (timerHandle != null) cancel(timerHandle);
    timerHandle = null;
  };

  /** Proyecta la sesión del contrato sobre los campos planos que leen las pantallas. */
  const project = (sess) => ({
    currentPhase: sess.phase,
    currentBlockIndex: sess.blockIndex,
    secondsRemaining: sess.secondsRemaining,
    phaseTotalSeconds: sess.phaseTotalSeconds,
    isTimerRunning: sess.running,
    activeBlocks: sess.blocks,
    activeConfig: {
      topic: sess.config.topic,
      subtopic: sess.config.subtopic,
      subtopicEmpty: !!sess.config.subtopicEmpty,
      blocksCount: sess.config.blocksCount,
      workMinutes: sess.config.workMinutes,
      shortBreakMinutes: sess.config.shortBreakMinutes,
      longBreakMinutes: sess.config.longBreakMinutes,
      longBreakEvery: sess.config.longBreakEvery,
    },
  });

  /** Envía una acción al contrato, aplica el resultado y dispara las alertas que pidió. */
  function dispatch(action) {
    if (!session) return;
    const wasFinished = session.finished;
    const result = reduceSession(session, action, now());
    session = result.session;
    set(project(session));
    if (session.finished && !wasFinished) {
      awaitingSessionStart = false;
      stopTicker();
      set({ isAwaitingSessionStart: false, lastSummary: extractSession(session), showSummaryDialog: true });
    }
    for (const ev of result.events) {
      if (ev.kind === EventKind.ALERT) alertNow(AlertType[ev.type]);
      else if (ev.kind === EventKind.HAPTIC && state.vibrationAlertsEnabled) alerts.vibrateFeedback();
    }
  }

  function startTimerTicker() {
    stopTicker();
    const token = timerToken;
    const loop = () => {
      // while (isTimerRunning && isSessionActive) { delay(1000); ... }
      if (token !== timerToken || !(state.isTimerRunning && state.isSessionActive)) return;
      timerHandle = schedule(() => {
        timerHandle = null;
        if (token !== timerToken) return;
        dispatch({ type: ActionType.TICK });
        loop();
      }, 1000);
    };
    loop();
  }

  function pauseTimer() {
    set({ isTimerRunning: false });
    if (session) session = { ...session, running: false };
    stopTicker();
  }
  function resumeTimer() {
    if (state.isReviewing) return; // una sesión guardada no se reanuda
    if (awaitingSessionStart) {
      awaitingSessionStart = false;
      set({ isAwaitingSessionStart: false });
      alertNow(AlertType.BLOCK_BEGINS);
    }
    set({ isTimerRunning: true });
    if (session) session = { ...session, running: true };
    startTimerTicker();
  }

  /** Sale de la revisión de una sesión guardada y vuelve al historial. */
  function closeReview() {
    stopTicker();
    session = null;
    activeSessionId = null;
    awaitingSessionStart = false;
    set({ isSessionActive: false, isReviewing: false, isAwaitingSessionStart: false, isTimerRunning: false, showSummaryDialog: false, currentTab: 2 });
  }

  function finishSessionPrompt() {
    if (state.isReviewing) { closeReview(); return; }
    pauseTimer();
    awaitingSessionStart = false;
    set({ isAwaitingSessionStart: false });
    dispatch({ type: ActionType.FINISH });
  }

  // --- API pública (nombres del ViewModel) ----------------------------------------------------
  const api = {
    presets,
    getState: () => state,
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },

    // Preferencias
    toggleSoundAlerts: () => set((s) => ({ soundAlertsEnabled: !s.soundAlertsEnabled })),
    toggleVibrationAlerts: () => set((s) => ({ vibrationAlertsEnabled: !s.vibrationAlertsEnabled })),
    setSoundAlerts: (enabled) => set({ soundAlertsEnabled: enabled }),
    setVibrationAlerts: (enabled) => set({ vibrationAlertsEnabled: enabled }),
    setDarkTheme: (isDark) => set({ isDarkTheme: isDark }),
    setPalette: (id) => set({ palette: esPaleta(id) ? id : PALETA_INICIAL }),
    toggleDarkTheme: (currentEffectiveDark) => set({ isDarkTheme: !currentEffectiveDark }),
    testAlert: (type) => alerts.triggerAlert(type, state.soundAlertsEnabled, state.vibrationAlertsEnabled),

    // Navegación
    setTab: (index) => set({ currentTab: index }),

    // Configuración. setConfig({ topic, subtopic, blocksCount, workMinutes, shortBreakMinutes, longBreakMinutes, longBreakEvery })
    setConfig(partial) {
      const patch = {};
      for (const [k, v] of Object.entries(partial)) patch[CONFIG_STATE_KEYS[k]] = v;
      set(patch);
    },
    addQuickTopic(topic) {
      const current = state.activeUser;
      if (!current) return false;
      const quickTopics = addUserTopic(current.quickTopics, topic);
      if (quickTopics.length === (current.quickTopics ?? []).length) return false;
      const updated = { ...current, quickTopics };
      db.updateUser(updated);
      set({ activeUser: updated, allUsers: db.allUsers() });
      return true;
    },
    removeQuickTopic(topic) {
      const current = state.activeUser;
      if (!current) return false;
      const updated = { ...current, quickTopics: removeUserTopic(current.quickTopics, topic) };
      if (updated.quickTopics.length === (current.quickTopics ?? []).length) return false;
      db.updateUser(updated);
      set({ activeUser: updated, allUsers: db.allUsers() });
      return true;
    },
    applyPreset(p) {
      set({ configBlocksCount: p.blocks, configWorkMinutes: p.workMinutes, configShortBreakMinutes: p.shortBreakMinutes, configLongBreakMinutes: p.longBreakMinutes, configLongBreakEvery: p.longBreakEvery ?? 4 });
    },
    setBlockGoal: (blockIndex, goal) => set((s) => ({ configBlockGoals: { ...s.configBlockGoals, [blockIndex]: goal } })),

    startSession({ startPaused = false } = {}) {
      activeSessionId = ++sessionSequence;
      awaitingSessionStart = startPaused;
      session = createSession(
        {
          topic: state.configTopic,
          subtopic: state.configSubtopic,
          blocksCount: state.configBlocksCount,
          workMinutes: state.configWorkMinutes,
          shortBreakMinutes: state.configShortBreakMinutes,
          longBreakMinutes: state.configLongBreakMinutes,
          longBreakEvery: state.configLongBreakEvery,
          blockGoals: state.configBlockGoals,
        },
        now(),
      );
      if (startPaused) session = { ...session, running: false };
      set({ ...project(session), isSessionActive: true, isReviewing: false, isAwaitingSessionStart: startPaused, currentTab: 1 });
      if (!startPaused) {
        alertNow(AlertType.BLOCK_BEGINS);
        startTimerTicker();
      }
      return activeSessionId;
    },
    replicateSavedSession(sessionId, mode) {
      if (!['configure', 'direct'].includes(mode) || (state.isSessionActive && !state.isReviewing)) return false;
      const saved = state.userSessions.find((item) => item.id === sessionId);
      if (!saved) return false;
      const savedBlocks = db.blocksForSession(sessionId);
      const config = {
        topic: saved.topic,
        subtopic: saved.subtopic,
        blocksCount: saved.totalBlocksPlanned,
        workMinutes: saved.workDurationMinutes,
        shortBreakMinutes: saved.shortBreakMinutes,
        longBreakMinutes: saved.longBreakMinutes,
        longBreakEvery: saved.longBreakEvery,
        blockGoals: Object.fromEntries(savedBlocks.filter((block) => block.goal !== `${saved.topic}: ${saved.subtopic}`).map((block) => [block.blockIndex, block.goal])),
      };
      const configPatch = Object.fromEntries(Object.entries(config).map(([key, value]) => [CONFIG_STATE_KEYS[key], value]));
      stopTicker();
      session = null;
      activeSessionId = null;
      awaitingSessionStart = false;
      set({ isSessionActive: false, isReviewing: false, isAwaitingSessionStart: false, isTimerRunning: false, showSummaryDialog: false, ...configPatch });
      if (mode === 'direct') api.startSession({ startPaused: true });
      else set({ currentTab: 0 });
      return true;
    },

    togglePlayPause() {
      if (state.isTimerRunning) pauseTimer();
      else resumeTimer();
    },
    pauseTimer,
    resumeTimer,
    addMinutes: (minutes) => dispatch({ type: ActionType.ADD_MINUTES, minutes }),
    toggleBlockCompletion: (blockIndex) => dispatch({ type: ActionType.TOGGLE_BLOCK, index: blockIndex }),
    markCurrentBlockCompleted: () => dispatch({ type: ActionType.COMPLETE_CURRENT }),
    skipCurrentPhase: () => dispatch({ type: ActionType.SKIP_PHASE }),
    restartPhase: () => dispatch({ type: ActionType.RESTART_PHASE }),
    finishSessionPrompt,

    saveCompletedSession(notes, rating) {
      const user = state.activeUser;
      if (!user || !state.lastSummary || !session) return;
      const record = toSavedRecord(session, { userId: user.id, notes, rating, endTime: now() });
      const sessionId = db.insertSession(record.session);
      db.insertBlocks(record.blocks.map((r) => ({ ...r, sessionId })));
      session = null;
      activeSessionId = null;
      awaitingSessionStart = false;
      refreshSessions();
      set({ isSessionActive: false, isAwaitingSessionStart: false, isTimerRunning: false, showSummaryDialog: false, currentTab: 2 });
    },
    cancelSession() {
      if (state.isReviewing) { closeReview(); return; }
      pauseTimer();
      session = null;
      activeSessionId = null;
      awaitingSessionStart = false;
      set({ isSessionActive: false, isAwaitingSessionStart: false, isTimerRunning: false, showSummaryDialog: false, currentTab: 0 });
    },
    cancelSessionIfCurrent(sessionId) {
      if (sessionId == null || sessionId !== activeSessionId || !state.isSessionActive || state.isReviewing) return false;
      api.cancelSession();
      return true;
    },
    /**
     * Reabre una sesión guardada para verla (solo lectura) con la visión que se elija. No reanuda nada ni cambia el registro.
     * Devuelve false si no existe o si hay una sesión en curso (no se descarta).
     */
    openSavedSession(sessionId) {
      if (state.isSessionActive && !state.isReviewing) return false;
      const saved = state.userSessions.find((s) => s.id === sessionId);
      if (!saved) return false;
      stopTicker();
      session = fromSavedRecord(saved, db.blocksForSession(sessionId));
      activeSessionId = ++sessionSequence;
      awaitingSessionStart = false;
      set({ ...project(session), isSessionActive: true, isReviewing: true, isAwaitingSessionStart: false, isTimerRunning: false, showSummaryDialog: false, lastSummary: null, currentTab: 1 });
      return true;
    },
    closeReview,
    dismissSummary() {
      session = null;
      activeSessionId = null;
      awaitingSessionStart = false;
      set({ showSummaryDialog: false, isSessionActive: false, isAwaitingSessionStart: false });
    },

    // Perfiles
    switchActiveUser(user) {
      set({ activeUser: user, userSessions: db.sessionsForUser(user.id) });
    },
    createUser(name, colorHex, dailyGoalMinutes, emoji) {
      const profileName = normalizeProfileName(name);
      if (!profileName) return;
      const newId = db.insertUser({ id: 0, name: profileName, colorHex, dailyGoalMinutes, avatarEmoji: emoji, createdAt: now(), quickTopics: [] });
      const created = { id: newId, name: profileName, colorHex, dailyGoalMinutes, avatarEmoji: emoji, createdAt: now(), quickTopics: [] };
      set({ allUsers: db.allUsers(), activeUser: created, userSessions: db.sessionsForUser(newId) });
    },
    updateActiveUserDailyGoal(newGoalMinutes) {
      const current = state.activeUser;
      if (!current) return;
      const updated = { ...current, dailyGoalMinutes: newGoalMinutes };
      db.updateUser(updated);
      set({ activeUser: updated, allUsers: db.allUsers() });
    },
    deleteSession(sessionId) {
      db.deleteSessionById(sessionId);
      refreshSessions();
    },
    /** StudyRepository.getBlocksForSession */
    getBlocksForSession: (sessionId) => db.blocksForSession(sessionId),
  };

  refreshUsersAndSessions();
  return api;
}
