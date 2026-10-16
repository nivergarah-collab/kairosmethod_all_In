import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, createDatabase, TimerPhase, AlertType, presets } from './store.js';

// Reloj y temporizador manuales para controlar los ticks de 1 s.
function harness() {
  let t = 1_000_000;
  const pending = [];
  const alerts = [];
  const store = createStore({
    db: createDatabase(null),
    alerts: { triggerAlert: (type, s, v) => alerts.push([type.key, s, v]), vibrateFeedback: () => alerts.push(['vibrate']) },
    now: () => t,
    schedule: (fn) => { pending.push(fn); return pending.length; },
    cancel: () => { pending.length = 0; },
  });
  const tick = (n = 1) => { for (let i = 0; i < n; i++) { t += 1000; pending.shift()?.(); } };
  return { store, tick, alerts };
}

test('crea el usuario por defecto como Room/StudyRepository.ensureDefaultUser', () => {
  const { store } = harness();
  const s = store.getState();
  assert.equal(s.allUsers.length, 1);
  assert.equal(s.activeUser.name, 'Estudiante Focus');
  assert.equal(s.activeUser.dailyGoalMinutes, 100);
  assert.equal(s.activeUser.avatarEmoji, '🚀');
});

test('startSession arma los bloques, cambia a la pestaña 1 y avisa', () => {
  const { store, alerts } = harness();
  store.applyPreset(presets[1]); // 3 bloques de 50
  store.setBlockGoal(2, 'Resolver guía');
  store.startSession();
  const s = store.getState();
  assert.equal(s.activeBlocks.length, 3);
  assert.equal(s.activeBlocks[0].goal, 'Programación Kotlin: Corrutinas y Flow');
  assert.equal(s.activeBlocks[1].goal, 'Resolver guía');
  assert.equal(s.secondsRemaining, 50 * 60);
  assert.equal(s.currentTab, 1);
  assert.deepEqual(alerts[0], ['BLOCK_BEGINS', true, true]);
});

test('la limpieza del tutorial solo cancela la sesión de muestra que inició', () => {
  const { store } = harness();
  store.setConfig({ topic: 'Muestra del tutorial' });
  const tutorialSessionId = store.startSession();

  store.setConfig({ topic: 'Sesión de estudio real' });
  store.startSession();

  assert.equal(store.cancelSessionIfCurrent(tutorialSessionId), false);
  assert.equal(store.getState().isSessionActive, true);
  assert.equal(store.getState().isTimerRunning, true);
  assert.equal(store.getState().activeConfig.topic, 'Sesión de estudio real');
});

test('el tutorial puede descartar la sesión de muestra si todavía es la sesión actual', () => {
  const { store } = harness();
  const tutorialSessionId = store.startSession();

  assert.equal(store.cancelSessionIfCurrent(tutorialSessionId), true);
  assert.equal(store.getState().isSessionActive, false);
  assert.equal(store.getState().isTimerRunning, false);
});

test('el bloque termina un tick después de llegar a 0 (delay(1000) y luego revisa)', () => {
  const { store, tick, alerts } = harness();
  store.setConfig({ workMinutes: 10, blocksCount: 2, shortBreakMinutes: 2 });
  store.startSession();
  tick(600);
  assert.equal(store.getState().secondsRemaining, 0);
  assert.equal(store.getState().currentPhase, TimerPhase.FOCUS);
  tick(1);
  const s = store.getState();
  assert.equal(s.currentPhase, TimerPhase.SHORT_BREAK);
  assert.equal(s.secondsRemaining, 120);
  assert.equal(s.activeBlocks[0].isCompleted, true);
  assert.ok(alerts.some((a) => a[0] === 'BLOCK_ENDS'));
});

test('descanso largo cada 4 bloques y fin de sesión con resumen', () => {
  const { store, tick } = harness();
  store.setConfig({ workMinutes: 10, blocksCount: 4, shortBreakMinutes: 2, longBreakMinutes: 10 });
  store.startSession();
  for (let b = 1; b <= 3; b++) { tick(601); assert.equal(store.getState().currentPhase, TimerPhase.SHORT_BREAK); tick(121); assert.equal(store.getState().currentBlockIndex, b + 1); }
  tick(601); // fin del bloque 4: es el último, termina la sesión
  const s = store.getState();
  assert.equal(s.showSummaryDialog, true);
  assert.equal(s.lastSummary.blocksCompleted, 4);
  assert.equal(s.lastSummary.completionRate, 1);
  assert.equal(s.isTimerRunning, false);
});

test('descanso largo cuando el bloque 4 no es el último', () => {
  const { store, tick } = harness();
  store.setConfig({ workMinutes: 10, blocksCount: 5, shortBreakMinutes: 2, longBreakMinutes: 10 });
  store.startSession();
  for (let b = 1; b <= 3; b++) { tick(601); tick(121); }
  tick(601);
  assert.equal(store.getState().currentPhase, TimerPhase.LONG_BREAK);
  assert.equal(store.getState().secondsRemaining, 600);
});

test('guardar la sesión la inserta con sus bloques y abre Estadísticas', () => {
  const { store, tick } = harness();
  store.setConfig({ workMinutes: 10, blocksCount: 1 });
  store.startSession();
  tick(601);
  store.saveCompletedSession('notas', 4);
  const s = store.getState();
  assert.equal(s.userSessions.length, 1);
  assert.equal(s.userSessions[0].satisfactionRating, 4);
  assert.equal(s.userSessions[0].isCompleted, true);
  assert.equal(store.getBlocksForSession(s.userSessions[0].id).length, 1);
  assert.equal(s.currentTab, 2);
  assert.equal(s.isSessionActive, false);
  store.deleteSession(s.userSessions[0].id);
  assert.equal(store.getState().userSessions.length, 0);
});

test('pausar, reanudar y sumar minutos', () => {
  const { store, tick } = harness();
  store.startSession();
  store.togglePlayPause();
  assert.equal(store.getState().isTimerRunning, false);
  store.togglePlayPause();
  tick(3);
  assert.equal(store.getState().secondsRemaining, 25 * 60 - 3);
  store.addMinutes(5);
  assert.equal(store.getState().phaseTotalSeconds, 30 * 60);
});

test('crear perfil lo deja activo; la meta diaria se actualiza', () => {
  const { store } = harness();
  store.createUser('Ana', '#10B981', 60, '🎓');
  assert.equal(store.getState().activeUser.name, 'Ana');
  store.updateActiveUserDailyGoal(90);
  assert.equal(store.getState().allUsers.find((u) => u.name === 'Ana').dailyGoalMinutes, 90);
});

test('el límite de 50 caracteres se aplica al crear perfiles y al persistirlos', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const store = createStore({ db: createDatabase(storage) });
  const name = 'N'.repeat(60);
  store.createUser(name, '#10B981', 60, '🎓');

  assert.equal(store.getState().activeUser.name.length, 50);
  assert.equal(JSON.parse(values.get('pomostudy_database.v1')).users.at(-1).name.length, 50);
});

test('los perfiles antiguos se normalizan al cargar para no desbordar la interfaz', () => {
  const values = new Map([['pomostudy_database.v1', JSON.stringify({
    users: [{ id: 1, name: 'X'.repeat(60), dailyGoalMinutes: 100, avatarEmoji: '🎓' }],
    sessions: [], blocks: [], seq: { users: 1, sessions: 0, blocks: 0 },
  })]]);
  const store = createStore({ db: createDatabase({ getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }) });
  assert.equal(store.getState().activeUser.name.length, 50);
  assert.equal(JSON.parse(values.get('pomostudy_database.v1')).users[0].name.length, 50);
});

test('AlertType expone los títulos del APK', () => {
  assert.equal(AlertType.SESSION_COMPLETE.title, 'Sesión Completada');
});

test('setPalette acepta solo paletas conocidas y vuelve a la original si no', () => {
  const { store } = harness();
  assert.equal(store.getState().palette, 'base');
  store.setPalette('salvia');
  assert.equal(store.getState().palette, 'salvia');
  store.setPalette('inventada');
  assert.equal(store.getState().palette, 'base');
});

test('activeConfig es la configuración de la sesión: no cambia si se edita el formulario después', () => {
  const { store } = harness();
  store.setConfig({ topic: 'Física', subtopic: 'Ondas', workMinutes: 30 });
  store.startSession();
  assert.equal(store.getState().activeConfig.topic, 'Física');
  assert.equal(store.getState().activeConfig.workMinutes, 30);
  store.setConfig({ topic: 'Otro tema', workMinutes: 10 });
  assert.equal(store.getState().activeConfig.topic, 'Física');
  assert.equal(store.getState().activeConfig.workMinutes, 30);
});

function guardarUna(h, topic = 'Álgebra') {
  const { store, tick } = h;
  store.setConfig({ topic, subtopic: 'Matrices', blocksCount: 2, workMinutes: 25 });
  store.startSession();
  tick(3);
  store.finishSessionPrompt();
  store.saveCompletedSession('nota', 4);
  return store.getState().userSessions[0];
}

test('openSavedSession reabre una sesión guardada en solo lectura, sin reanudar ni cambiar el registro', () => {
  const h = harness();
  const saved = guardarUna(h);
  const { store } = h;
  const antes = JSON.stringify(store.getState().userSessions);
  assert.equal(store.openSavedSession(saved.id), true);
  const s = store.getState();
  assert.equal(s.isReviewing, true);
  assert.equal(s.isSessionActive, true);
  assert.equal(s.isTimerRunning, false);
  assert.equal(s.showSummaryDialog, false);
  assert.equal(s.currentTab, 1);
  assert.equal(s.activeConfig.topic, 'Álgebra');
  assert.equal(s.activeBlocks.length, 2);
  // ningún control cambia la sesión ni arranca el reloj
  store.togglePlayPause(); store.resumeTimer(); store.addMinutes(5); store.skipCurrentPhase(); store.restartPhase(); store.toggleBlockCompletion(1);
  h.tick(5);
  const d = store.getState();
  assert.equal(d.isTimerRunning, false);
  assert.equal(d.secondsRemaining, s.secondsRemaining);
  assert.deepEqual(d.activeBlocks, s.activeBlocks);
  assert.equal(JSON.stringify(d.userSessions), antes);
});

test('al terminar o cancelar la revisión se vuelve al historial sin diálogo de resumen ni guardado', () => {
  for (const salir of ['finishSessionPrompt', 'cancelSession', 'closeReview']) {
    const h = harness();
    const saved = guardarUna(h);
    h.store.openSavedSession(saved.id);
    h.store[salir]();
    const s = h.store.getState();
    assert.equal(s.isReviewing, false, salir);
    assert.equal(s.isSessionActive, false, salir);
    assert.equal(s.showSummaryDialog, false, salir);
    assert.equal(s.currentTab, 2, salir);
    assert.equal(s.userSessions.length, 1, salir);
  }
});

test('openSavedSession no descarta una sesión en curso y rechaza ids que no existen', () => {
  const h = harness();
  const saved = guardarUna(h);
  assert.equal(h.store.openSavedSession(9999), false);
  assert.equal(h.store.getState().isReviewing, false);
  h.store.setConfig({ topic: 'En curso' });
  h.store.startSession();
  assert.equal(h.store.openSavedSession(saved.id), false);
  assert.equal(h.store.getState().isReviewing, false);
  assert.equal(h.store.getState().activeConfig.topic, 'En curso');
  assert.equal(h.store.getState().isTimerRunning, true);
});

test('empezar una sesión nueva durante una revisión la reemplaza', () => {
  const h = harness();
  const saved = guardarUna(h);
  h.store.openSavedSession(saved.id);
  h.store.setConfig({ topic: 'Nueva' });
  h.store.startSession();
  const s = h.store.getState();
  assert.equal(s.isReviewing, false);
  assert.equal(s.isTimerRunning, true);
  assert.equal(s.activeConfig.topic, 'Nueva');
});

test('replicar como plantilla carga la configuración y objetivos guardados sin iniciar sesión', () => {
  const h = harness();
  h.store.setConfig({ topic: 'Biología', subtopic: 'Célula', blocksCount: 3, workMinutes: 40, shortBreakMinutes: 8, longBreakMinutes: 18, longBreakEvery: 2 });
  h.store.setBlockGoal(1, 'Leer capítulo');
  h.store.setBlockGoal(3, 'Resolver guía');
  h.store.startSession();
  h.store.finishSessionPrompt();
  h.store.saveCompletedSession('no copiar', 2);
  const saved = h.store.getState().userSessions[0];

  h.store.setConfig({ topic: 'Otro', subtopic: 'Tema', blocksCount: 1, workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 4 });
  assert.equal(h.store.replicateSavedSession(saved.id, 'configure'), true);

  const state = h.store.getState();
  assert.equal(state.currentTab, 0);
  assert.equal(state.isSessionActive, false);
  assert.equal(state.isTimerRunning, false);
  assert.equal(state.configTopic, 'Biología');
  assert.equal(state.configSubtopic, 'Célula');
  assert.equal(state.configBlocksCount, 3);
  assert.equal(state.configWorkMinutes, 40);
  assert.equal(state.configShortBreakMinutes, 8);
  assert.equal(state.configLongBreakMinutes, 18);
  assert.equal(state.configLongBreakEvery, 2);
  assert.deepEqual(state.configBlockGoals, { 1: 'Leer capítulo', 3: 'Resolver guía' });
  assert.equal(state.userSessions.length, 1);
  assert.equal(state.userSessions[0].notes, 'no copiar');
});

test('replicar directamente prepara la sesión detenida y el reloj solo parte al iniciar', () => {
  const h = harness();
  h.store.setConfig({ topic: 'Química', subtopic: 'Enlaces', blocksCount: 2, workMinutes: 35, shortBreakMinutes: 6, longBreakMinutes: 12, longBreakEvery: 0 });
  h.store.setBlockGoal(2, 'Practicar ejercicios');
  h.store.startSession();
  h.store.finishSessionPrompt();
  h.store.saveCompletedSession('no copiar', 1);
  const saved = h.store.getState().userSessions[0];
  h.alerts.length = 0;

  assert.equal(h.store.replicateSavedSession(saved.id, 'direct'), true);
  let state = h.store.getState();
  assert.equal(state.currentTab, 1);
  assert.equal(state.isSessionActive, true);
  assert.equal(state.isReviewing, false);
  assert.equal(state.isAwaitingSessionStart, true);
  assert.equal(state.isTimerRunning, false);
  assert.equal(state.secondsRemaining, 35 * 60);
  assert.equal(state.activeConfig.topic, 'Química');
  assert.equal(state.activeBlocks[0].isCompleted, false);
  assert.equal(state.activeBlocks[1].goal, 'Practicar ejercicios');
  assert.deepEqual(h.alerts, []);

  h.tick(5);
  assert.equal(h.store.getState().secondsRemaining, 35 * 60);
  assert.equal(h.store.getState().isTimerRunning, false);
  h.store.togglePlayPause();
  state = h.store.getState();
  assert.equal(state.isTimerRunning, true);
  assert.equal(state.isAwaitingSessionStart, false);
  assert.deepEqual(h.alerts[0], ['BLOCK_BEGINS', true, true]);
  h.tick(1);
  assert.equal(h.store.getState().secondsRemaining, 35 * 60 - 1);
});

test('replicar rechaza sesiones inexistentes y protege una sesión activa', () => {
  const h = harness();
  const saved = guardarUna(h);
  assert.equal(h.store.replicateSavedSession(9999, 'configure'), false);
  h.store.setConfig({ topic: 'En curso' });
  h.store.startSession();
  assert.equal(h.store.replicateSavedSession(saved.id, 'direct'), false);
  assert.equal(h.store.getState().activeConfig.topic, 'En curso');
  assert.equal(h.store.getState().isTimerRunning, true);
});
