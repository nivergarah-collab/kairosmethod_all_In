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

test('AlertType expone los títulos del APK', () => {
  assert.equal(AlertType.SESSION_COMPLETE.title, 'Sesión Completada');
});
