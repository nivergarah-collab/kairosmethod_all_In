// Port de MainViewModel.kt + StudyRepository.kt: mismo estado, mismas acciones y mismas reglas.
// Sin dependencias del navegador: la base de datos, las alertas y el reloj se inyectan (así se prueba en Node).

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
  { name: 'Clásico Pomodoro', description: '25 min estudio / 5 min descanso', blocks: 4, workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 },
  { name: 'Deep Work Intensivo', description: '50 min estudio / 10 min descanso', blocks: 3, workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 },
  { name: 'Sprint Rápido', description: '15 min estudio / 3 min descanso', blocks: 4, workMinutes: 15, shortBreakMinutes: 3, longBreakMinutes: 10 },
  { name: 'Maratón de Estudio', description: '45 min estudio / 15 min descanso', blocks: 6, workMinutes: 45, shortBreakMinutes: 15, longBreakMinutes: 25 },
];

/** Reemplazo de Room (AppDatabase "pomostudy_database"): tablas user_profiles, study_sessions, study_blocks. */
export function createDatabase(storage = null, key = 'pomostudy_database.v1') {
  let data = { users: [], sessions: [], blocks: [], seq: { users: 0, sessions: 0, blocks: 0 } };
  try {
    const raw = storage?.getItem(key);
    if (raw) data = { ...data, ...JSON.parse(raw) };
  } catch {
    /* base ilegible: se empieza vacía, como fallbackToDestructiveMigration */
  }
  const save = () => {
    try {
      storage?.setItem(key, JSON.stringify(data));
    } catch {
      /* sin almacenamiento: queda en memoria */
    }
  };
  const next = (t) => ++data.seq[t];
  return {
    allUsers: () => [...data.users].sort((a, b) => a.id - b.id),
    insertUser(u) {
      const id = u.id ? u.id : next('users');
      data.users = data.users.filter((x) => x.id !== id).concat({ ...u, id });
      save();
      return id;
    },
    updateUser(u) {
      data.users = data.users.map((x) => (x.id === u.id ? { ...u } : x));
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
  let accumulatedFocusSeconds = 0;
  let accumulatedBreakSeconds = 0;
  let sessionStartTime = 0;
  let timerHandle = null;
  let timerToken = 0;

  let state = {
    soundAlertsEnabled: true,
    vibrationAlertsEnabled: true,
    isDarkTheme: null, // null = seguir al sistema
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
    configBlockGoals: {},
    // Sesión activa
    isSessionActive: false,
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
  function startTimerTicker() {
    stopTicker();
    const token = timerToken;
    const loop = () => {
      // while (isTimerRunning && isSessionActive) { delay(1000); ... }
      if (token !== timerToken || !(state.isTimerRunning && state.isSessionActive)) return;
      timerHandle = schedule(() => {
        timerHandle = null;
        if (token !== timerToken) return;
        if (state.secondsRemaining > 0) {
          set((s) => ({ secondsRemaining: s.secondsRemaining - 1 }));
          if (state.currentPhase === TimerPhase.FOCUS) accumulatedFocusSeconds++;
          else accumulatedBreakSeconds++;
        } else {
          onPhaseComplete();
        }
        loop();
      }, 1000);
    };
    loop();
  }

  function onPhaseComplete() {
    const current = state.currentPhase;
    const currentIndex = state.currentBlockIndex;
    const totalBlocks = state.activeBlocks.length;

    if (current === TimerPhase.FOCUS) {
      // Marca el bloque como completado si aún no lo estaba
      set((s) => ({
        activeBlocks: s.activeBlocks.map((b) => (b.index === currentIndex && !b.isCompleted ? { ...b, isCompleted: true, completedAt: now() } : b)),
      }));
      if (currentIndex >= totalBlocks) {
        alertNow(AlertType.SESSION_COMPLETE);
        finishSessionPrompt();
      } else {
        alertNow(AlertType.BLOCK_ENDS);
        const isLongBreak = currentIndex % 4 === 0;
        const breakMinutes = isLongBreak ? state.configLongBreakMinutes : state.configShortBreakMinutes;
        const breakSeconds = breakMinutes * 60;
        set({ currentPhase: isLongBreak ? TimerPhase.LONG_BREAK : TimerPhase.SHORT_BREAK, secondsRemaining: breakSeconds, phaseTotalSeconds: breakSeconds });
      }
    } else {
      const nextIndex = currentIndex + 1;
      if (nextIndex <= totalBlocks) {
        const workSeconds = state.configWorkMinutes * 60;
        set({ currentBlockIndex: nextIndex, currentPhase: TimerPhase.FOCUS, secondsRemaining: workSeconds, phaseTotalSeconds: workSeconds });
        alertNow(AlertType.BLOCK_BEGINS);
      } else {
        alertNow(AlertType.SESSION_COMPLETE);
        finishSessionPrompt();
      }
    }
  }

  function pauseTimer() {
    set({ isTimerRunning: false });
    stopTicker();
  }
  function resumeTimer() {
    set({ isTimerRunning: true });
    startTimerTicker();
  }

  function finishSessionPrompt() {
    pauseTimer();
    const totalPlanned = state.activeBlocks.length;
    const completedCount = state.activeBlocks.filter((b) => b.isCompleted).length;
    const completionRate = totalPlanned > 0 ? completedCount / totalPlanned : 1;
    set({
      lastSummary: {
        topic: state.configTopic.trim() === '' ? 'Tema General' : state.configTopic,
        subtopic: state.configSubtopic.trim() === '' ? 'Sesión de Estudio' : state.configSubtopic,
        totalBlocksPlanned: totalPlanned,
        blocksCompleted: completedCount,
        focusSeconds: accumulatedFocusSeconds,
        breakSeconds: accumulatedBreakSeconds,
        completionRate,
        satisfactionRating: 5,
        notes: '',
      },
      showSummaryDialog: true,
    });
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
    toggleDarkTheme: (currentEffectiveDark) => set({ isDarkTheme: !currentEffectiveDark }),
    testAlert: (type) => alerts.triggerAlert(type, state.soundAlertsEnabled, state.vibrationAlertsEnabled),

    // Navegación
    setTab: (index) => set({ currentTab: index }),

    // Configuración. setConfig({ topic, subtopic, blocksCount, workMinutes, shortBreakMinutes, longBreakMinutes })
    setConfig(partial) {
      const map = { topic: 'configTopic', subtopic: 'configSubtopic', blocksCount: 'configBlocksCount', workMinutes: 'configWorkMinutes', shortBreakMinutes: 'configShortBreakMinutes', longBreakMinutes: 'configLongBreakMinutes' };
      const patch = {};
      for (const [k, v] of Object.entries(partial)) patch[map[k]] = v;
      set(patch);
    },
    applyPreset(p) {
      set({ configBlocksCount: p.blocks, configWorkMinutes: p.workMinutes, configShortBreakMinutes: p.shortBreakMinutes, configLongBreakMinutes: p.longBreakMinutes });
    },
    setBlockGoal: (blockIndex, goal) => set((s) => ({ configBlockGoals: { ...s.configBlockGoals, [blockIndex]: goal } })),

    startSession() {
      const totalBlocks = state.configBlocksCount;
      const workMins = state.configWorkMinutes;
      const topic = state.configTopic.trim() === '' ? 'Tema General' : state.configTopic;
      const subtopic = state.configSubtopic.trim() === '' ? 'Sesión de Enfoque' : state.configSubtopic;
      const blocks = Array.from({ length: totalBlocks }, (_, k) => {
        const i = k + 1;
        const customGoal = state.configBlockGoals[i] ?? '';
        return { index: i, title: `Bloque ${i}`, goal: customGoal.trim() !== '' ? customGoal : `${topic}: ${subtopic}`, durationMinutes: workMins, isCompleted: false, completedAt: null };
      });
      const initialSeconds = workMins * 60;
      accumulatedFocusSeconds = 0;
      accumulatedBreakSeconds = 0;
      sessionStartTime = now();
      set({
        activeBlocks: blocks,
        currentBlockIndex: 1,
        currentPhase: TimerPhase.FOCUS,
        secondsRemaining: initialSeconds,
        phaseTotalSeconds: initialSeconds,
        isSessionActive: true,
        isTimerRunning: true,
        currentTab: 1,
      });
      alertNow(AlertType.BLOCK_BEGINS);
      startTimerTicker();
    },

    togglePlayPause() {
      if (state.isTimerRunning) pauseTimer();
      else resumeTimer();
    },
    pauseTimer,
    resumeTimer,
    addMinutes(minutes) {
      const extra = minutes * 60;
      set((s) => ({ secondsRemaining: s.secondsRemaining + extra, phaseTotalSeconds: s.phaseTotalSeconds + extra }));
    },
    toggleBlockCompletion(blockIndex) {
      if (state.vibrationAlertsEnabled) alerts.vibrateFeedback();
      set((s) => ({
        activeBlocks: s.activeBlocks.map((b) => {
          if (b.index !== blockIndex) return b;
          const newState = !b.isCompleted;
          return { ...b, isCompleted: newState, completedAt: newState ? now() : null };
        }),
      }));
    },
    markCurrentBlockCompleted() {
      api.toggleBlockCompletion(state.currentBlockIndex);
    },
    skipCurrentPhase: () => onPhaseComplete(),
    finishSessionPrompt,

    saveCompletedSession(notes, rating) {
      const user = state.activeUser;
      const summary = state.lastSummary;
      if (!user || !summary) return;
      const session = {
        userId: user.id,
        topic: summary.topic,
        subtopic: summary.subtopic,
        totalBlocksPlanned: summary.totalBlocksPlanned,
        blocksCompleted: summary.blocksCompleted,
        workDurationMinutes: state.configWorkMinutes,
        shortBreakMinutes: state.configShortBreakMinutes,
        longBreakMinutes: state.configLongBreakMinutes,
        totalFocusSecondsSpent: summary.focusSeconds,
        totalBreakSecondsSpent: summary.breakSeconds,
        startTime: sessionStartTime,
        endTime: now(),
        isCompleted: summary.blocksCompleted >= summary.totalBlocksPlanned,
        notes,
        satisfactionRating: rating,
      };
      const records = state.activeBlocks.map((b) => ({
        sessionId: 0,
        blockIndex: b.index,
        title: b.title,
        goal: b.goal,
        durationMinutes: b.durationMinutes,
        isCompleted: b.isCompleted,
        completedAt: b.completedAt,
      }));
      const sessionId = db.insertSession(session);
      db.insertBlocks(records.map((r) => ({ ...r, sessionId })));
      refreshSessions();
      set({ isSessionActive: false, isTimerRunning: false, showSummaryDialog: false, currentTab: 2 });
    },
    cancelSession() {
      pauseTimer();
      set({ isSessionActive: false, isTimerRunning: false, showSummaryDialog: false, currentTab: 0 });
    },
    dismissSummary: () => set({ showSummaryDialog: false, isSessionActive: false }),

    // Perfiles
    switchActiveUser(user) {
      set({ activeUser: user, userSessions: db.sessionsForUser(user.id) });
    },
    createUser(name, colorHex, dailyGoalMinutes, emoji) {
      const newId = db.insertUser({ id: 0, name, colorHex, dailyGoalMinutes, avatarEmoji: emoji, createdAt: now() });
      const created = { id: newId, name, colorHex, dailyGoalMinutes, avatarEmoji: emoji, createdAt: now() };
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
