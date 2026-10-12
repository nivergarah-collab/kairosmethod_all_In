// Port de MainActivity.kt (PomoStudyApp): Scaffold con NavigationBar de 3 pestañas + diálogos.
import React, { useEffect, useMemo, useState } from 'react';
import './app.css';
import { Icon } from './m3.jsx';
import { createStore, createDatabase } from './store.js';
import { createAlertManager } from './alerts.js';
import { safeLocalStorage } from './storage.js';
import { StoreProvider, useVM, useEffectiveDark } from './useStore.jsx';
import { SessionConfigScreen } from './screens/SessionConfigScreen.jsx';
import { ActiveTimerScreen } from './screens/ActiveTimerScreen.jsx';
import { StatsScreen } from './screens/StatsScreen.jsx';
import { SessionSummaryDialog } from './screens/SessionSummaryDialog.jsx';
import { UserManagementDialog } from './screens/UserManagementDialog.jsx';

function PomoStudyApp() {
  const { state, vm } = useVM();
  const [showUserDialog, setShowUserDialog] = useState(false);
  const isDark = useEffectiveDark();

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  // BackHandler(enabled = currentTab != 0) { setTab(0) }: en web, la tecla Escape no aplica; se deja el botón Atrás del navegador sin tocar.

  const tabs = [
    { id: 0, label: 'Configurar', filled: 'Tune', outlined: 'Outlined.Tune', desc: 'Configurar', testId: 'tab_config' },
    { id: 1, label: 'Temporizador', filled: 'PlayCircle', outlined: 'Outlined.PlayCircleOutline', desc: 'En Curso', testId: 'tab_timer' },
    { id: 2, label: 'Estadísticas', filled: 'Assessment', outlined: 'Outlined.Assessment', desc: 'Estadísticas', testId: 'tab_stats' },
  ];

  return (
    <div className="app-shell">
      <div className="app-col">
        <div className="app-content">
          <div className="app-screen" key={state.currentTab}>
            {state.currentTab === 0 && <SessionConfigScreen onOpenUserDialog={() => setShowUserDialog(true)} />}
            {state.currentTab === 1 && <ActiveTimerScreen />}
            {state.currentTab === 2 && <StatsScreen onOpenUserDialog={() => setShowUserDialog(true)} />}
          </div>
        </div>
        <nav className="nav-bar" data-testid="main_bottom_nav">
          {tabs.map((t) => {
            const selected = state.currentTab === t.id;
            return (
              <button key={t.id} type="button" className={`nav-item${selected ? ' sel' : ''}`} onClick={() => vm.setTab(t.id)} data-testid={t.testId}>
                <span className="nav-ind">
                  <Icon name={selected ? t.filled : t.outlined} size={24} label={t.desc} />
                  {t.id === 1 && state.isSessionActive && <span className="nav-badge" />}
                </span>
                <span className="nav-label">{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {showUserDialog && (
        <UserManagementDialog
          users={state.allUsers}
          activeUser={state.activeUser}
          onSelectUser={(u) => vm.switchActiveUser(u)}
          onCreateUser={(name, colorHex, dailyGoalMinutes, emoji) => vm.createUser(name, colorHex, dailyGoalMinutes, emoji)}
          onDismiss={() => setShowUserDialog(false)}
        />
      )}
      {state.showSummaryDialog && state.lastSummary && (
        <SessionSummaryDialog
          summary={state.lastSummary}
          onSaveSession={(notes, rating) => vm.saveCompletedSession(notes, rating)}
          onDismiss={() => vm.dismissSummary()}
        />
      )}
    </div>
  );
}

export default function App() {
  const store = useMemo(() => createStore({ db: createDatabase(safeLocalStorage()), alerts: createAlertManager() }), []);
  return (
    <StoreProvider store={store}>
      <PomoStudyApp />
    </StoreProvider>
  );
}
