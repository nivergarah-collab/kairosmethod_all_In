// Port de ui/stats/StatsScreen.kt
import React, { useState } from 'react';
import { Icon, IconButton, Surface, Card, Button, TextButton, AlertDialog, T, alpha } from '../m3.jsx';
import { useVM } from '../useStore.jsx';
import { StatCard, SimpleBarChart, UserSelectorBar } from '../components/CommonComponents.jsx';
import { DailyGoalProgressCard, DailyGoalSettingDialog } from '../components/DailyGoalComponents.jsx';
import { WeeklyStudyProductivityCard, format1, formatDayMonthTime } from '../components/WeeklyStudyChart.jsx';

export function StatsScreen({ onOpenUserDialog }) {
  const { state, vm } = useVM();
  const activeUser = state.activeUser;
  const sessions = state.userSessions;

  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [showGoalEditor, setShowGoalEditor] = useState(false);

  const totalFocusSeconds = sessions.reduce((acc, s) => acc + s.totalFocusSecondsSpent, 0);
  const totalFocusMinutes = Math.floor(totalFocusSeconds / 60);
  const totalFocusHours = Math.floor(totalFocusMinutes / 60);
  const remainingMinutes = totalFocusMinutes % 60;
  const totalBlocksCompleted = sessions.reduce((acc, s) => acc + s.blocksCompleted, 0);
  const averageRating =
    sessions.length > 0 ? format1(sessions.reduce((acc, s) => acc + s.satisfactionRating, 0) / sessions.length) : '0,0';

  // Prepare chart data for last 7 sessions
  const chartSessions = sessions.slice(0, 7).reverse();
  const chartValues = chartSessions.map((s) => Math.floor(s.totalFocusSecondsSpent / 60));
  const chartLabels = chartSessions.map((s) => {
    const topic = s.topic.trim();
    return topic.length > 5 ? topic.slice(0, 4) + '..' : topic;
  });

  return (
    <div data-testid="stats_screen" style={{ boxSizing: 'border-box', padding: '12px 18px', color: 'var(--on-surface)' }}>
      {/* Grupos de disposición: en celular no generan caja (display: contents); en tablet/PC forman 2 columnas (ver app.css) */}
      <div className="rs-grid">
      <div className="rs-col">
      {/* User header & selector */}
      <UserSelectorBar user={activeUser} onSwitchUserClick={onOpenUserDialog} />

      <div style={{ height: 14 }} />

      {/* Daily Goal Dynamic Progress Card */}
      <DailyGoalProgressCard user={activeUser} sessions={sessions} onEditGoalClick={() => setShowGoalEditor(true)} />

      <div style={{ height: 16 }} />

      {/* KPI Grid */}
      <div style={{ display: 'flex', width: '100%', gap: 10 }}>
        <StatCard
          title="Tiempo Total"
          value={totalFocusHours > 0 ? `${totalFocusHours}h ${remainingMinutes}m` : `${totalFocusMinutes}m`}
          subtitle="Enfoque acumulado"
          accentColor="var(--pomo-primary)"
          style={{ flex: 1, minWidth: 0 }}
        />
        <StatCard
          title="Sesiones"
          value={`${sessions.length}`}
          subtitle="Registradas"
          accentColor="var(--break-green)"
          style={{ flex: 1, minWidth: 0 }}
        />
      </div>

      <div style={{ height: 10 }} />

      <div style={{ display: 'flex', width: '100%', gap: 10 }}>
        <StatCard
          title="Bloques Hechos"
          value={`${totalBlocksCompleted}`}
          subtitle="Pomodoros"
          accentColor="var(--pomo-secondary)"
          style={{ flex: 1, minWidth: 0 }}
        />
        <StatCard
          title="Calificación"
          value={`★ ${averageRating}`}
          subtitle="Promedio enfoque"
          accentColor="var(--pomo-accent-gold)"
          style={{ flex: 1, minWidth: 0 }}
        />
      </div>

      <div style={{ height: 20 }} />

      {/* Weekly Study Productivity Chart (Weekly hours summary, daily breakdown & target goal) */}
      <WeeklyStudyProductivityCard sessions={sessions} dailyGoalMinutes={activeUser?.dailyGoalMinutes ?? 100} />

      <div style={{ height: 14 }} />
      </div>

      <div className="rs-col">
      {/* Individual Sessions Bar Chart (Collapsible/Secondary visualization) */}
      <Card color="var(--surface)" radius={16} border={`1px solid ${alpha('var(--outline-variant)', 0.4)}`} style={{ width: '100%' }}>
        <div style={{ padding: 16 }}>
          <T v="titleSmall" w="bold" as="div">Actividad por Sesión Individual (min)</T>
          <div style={{ height: 12 }} />
          <SimpleBarChart values={chartValues} labels={chartLabels} primaryColor="var(--pomo-primary)" />
        </div>
      </Card>

      <div style={{ height: 20 }} />

      {/* History Section Header */}
      <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
        <T v="titleMedium" w="bold">{`Historial de Sesiones (${sessions.length})`}</T>
      </div>

      <div style={{ height: 10 }} />

      {sessions.length === 0 ? (
        <Card
          color={alpha('var(--surface-variant)', 0.35)}
          radius={16}
          style={{ width: '100%', margin: '16px 0', boxSizing: 'border-box' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box', padding: 24 }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-variant)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="History" size={32} tint="var(--on-surface-variant)" />
            </div>

            <div style={{ height: 12 }} />

            <T v="titleMedium" w="bold">Aún no tienes sesiones registradas</T>

            <T v="bodySmall" color="var(--on-surface-variant)" style={{ display: 'block', textAlign: 'center', padding: '4px 0 14px' }}>
              Completa tu primera sesión Pomodoro para ver tu progreso, tiempo y notas aquí.
            </T>

            <Button onClick={() => vm.setTab(0)} color="var(--pomo-primary)" radius={12}>
              <Icon name="PlayArrow" size={16} />
              <span style={{ width: 6, flex: 'none' }} />
              Iniciar mi primera sesión
            </Button>
          </div>
        </Card>
      ) : (
        sessions.map((session) => (
          <SessionHistoryCard
            key={session.id}
            session={session}
            onDeleteClick={() => setSessionToDelete(session)}
            style={{ margin: '6px 0' }}
          />
        ))
      )}

      <div style={{ height: 32 }} />
      </div>
      </div>

      {showGoalEditor && (
        <DailyGoalSettingDialog
          currentGoalMinutes={activeUser?.dailyGoalMinutes ?? 120}
          onSaveGoal={(newGoal) => {
            vm.updateActiveUserDailyGoal(newGoal);
          }}
          onDismiss={() => setShowGoalEditor(false)}
        />
      )}

      {sessionToDelete != null && (
        <AlertDialog
          onDismiss={() => setSessionToDelete(null)}
          title="Eliminar sesión"
          text="¿Deseas eliminar el registro de esta sesión de estudio? Esta acción no se puede deshacer."
          confirmButton={
            <TextButton
              onClick={() => {
                if (sessionToDelete != null) vm.deleteSession(sessionToDelete.id);
                setSessionToDelete(null);
              }}
            >
              <span style={{ color: 'var(--error)' }}>Eliminar</span>
            </TextButton>
          }
          dismissButton={<TextButton onClick={() => setSessionToDelete(null)}>Cancelar</TextButton>}
        />
      )}
    </div>
  );
}

function SessionHistoryCard({ session, onDeleteClick, style }) {
  const formattedDate = formatDayMonthTime(new Date(session.endTime));
  const focusMinutes = Math.floor(session.totalFocusSecondsSpent / 60);

  return (
    <Card
      testId={`session_history_item_${session.id}`}
      color="var(--surface)"
      radius={16}
      border={`1px solid ${alpha('var(--outline-variant)', 0.4)}`}
      style={{ width: '100%', boxSizing: 'border-box', ...style }}
    >
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <T v="titleMedium" w="bold" color="var(--on-surface)" ellipsis>{session.topic}</T>
            <T v="bodySmall" color="var(--on-surface-variant)" ellipsis>{session.subtopic}</T>
          </div>

          <IconButton onClick={onDeleteClick} label="Eliminar sesión" style={{ width: 32, height: 32 }}>
            <Icon name="DeleteOutline" size={18} tint="var(--outline)" />
          </IconButton>
        </div>

        <div style={{ height: 10 }} />

        {/* Metrics row */}
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Surface radius={8} color={alpha('var(--pomo-primary)', 0.12)}>
              <T v="labelSmall" w="bold" color="var(--pomo-primary)" style={{ display: 'block', padding: '4px 8px' }}>
                {`${focusMinutes}m enfoque`}
              </T>
            </Surface>

            <Surface radius={8} color={alpha('var(--break-green)', 0.12)}>
              <T v="labelSmall" w="bold" color="var(--break-green)" style={{ display: 'block', padding: '4px 8px' }}>
                {`${session.blocksCompleted}/${session.totalBlocksPlanned} bloques`}
              </T>
            </Surface>
          </div>

          {/* Stars */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon name="Star" size={14} tint="var(--pomo-accent-gold)" />
            <span style={{ width: 3, flex: 'none' }} />
            <T v="labelMedium" w="bold">{`${session.satisfactionRating}`}</T>
          </div>
        </div>

        {(session.notes ?? '').trim() !== '' && (
          <>
            <div style={{ height: 8 }} />
            <Surface radius={8} color={alpha('var(--surface-variant)', 0.4)} style={{ width: '100%' }}>
              <T v="bodySmall" color="var(--on-surface)" style={{ display: 'block', padding: '6px 10px' }}>
                {`📝 "${session.notes}"`}
              </T>
            </Surface>
          </>
        )}

        <div style={{ height: 6 }} />

        <T v="labelSmall" size={10} color="var(--on-surface-variant)" as="div">{formattedDate}</T>
      </div>
    </Card>
  );
}
