// Port de ui/components/DailyGoalComponents.kt
import React, { useState } from 'react';
import { Icon, Surface, Card, Button, OutlinedButton, IconButton, Slider, T, alpha } from '../m3.jsx';
import './daily-goal.css';

const fmt1 = (n) => n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const ring = (w, color) => ({ boxShadow: `inset 0 0 0 ${w}px ${color}` });

export function DailyGoalProgressCard({ user, sessions, onEditGoalClick }) {
  const goalMinutes = Math.max(user?.dailyGoalMinutes ?? 120, 15);
  const goalHours = goalMinutes / 60;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const todayFocusSeconds = sessions
    .filter((s) => s.endTime >= startOfToday.getTime() && s.endTime <= endOfToday.getTime())
    .reduce((acc, s) => acc + s.totalFocusSecondsSpent, 0);

  const todayFocusMinutes = Math.trunc(todayFocusSeconds / 60);
  const todayFocusHours = todayFocusMinutes / 60;
  const remainingMinutes = Math.max(goalMinutes - todayFocusMinutes, 0);
  const remainingHours = remainingMinutes / 60;

  const progressFraction = Math.max(todayFocusMinutes / goalMinutes, 0);
  const progressPercent = Math.trunc(progressFraction * 100);
  const isGoalCompleted = todayFocusMinutes >= goalMinutes;
  const animatedProgress = Math.min(Math.max(progressFraction, 0), 1);

  let status;
  if (isGoalCompleted) status = '🎉 ¡Felicidades! Superaste tu meta diaria.';
  else if (todayFocusMinutes === 0) status = 'Completa sesiones Pomodoro para avanzar.';
  else if (progressFraction >= 0.75) status = `¡Casi listo! Solo faltan ${remainingMinutes}m.`;
  else if (progressFraction >= 0.5) status = '¡A mitad de camino! Excelente ritmo.';
  else status = `Buen comienzo hoy. Faltan ${fmt1(remainingHours)}h.`;

  return (
    <Card
      testId="daily_goal_card"
      color="var(--surface)"
      radius={20}
      style={{ width: '100%', ...ring(1, isGoalCompleted ? alpha('var(--break-green)', 0.6) : alpha('var(--outline-variant)', 0.45)) }}
    >
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 38, height: 38, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isGoalCompleted ? alpha('var(--break-green)', 0.18) : alpha('var(--pomo-primary)', 0.15),
              }}
            >
              <Icon
                name={isGoalCompleted ? 'EmojiEvents' : 'TrackChanges'}
                size={22}
                tint={isGoalCompleted ? 'var(--break-green)' : 'var(--pomo-primary)'}
              />
            </div>
            <div style={{ width: 12, flex: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <T v="titleMedium" w="bold">Meta Diaria de Estudio</T>
              <T v="bodySmall" color={isGoalCompleted ? 'var(--break-green)' : 'var(--on-surface-variant)'}>
                {isGoalCompleted ? '¡Objetivo alcanzado hoy!' : 'Progreso del día en tiempo real'}
              </T>
            </div>
          </div>

          <Surface
            testId="edit_daily_goal_button"
            radius={12}
            color={alpha('var(--primary)', 0.12)}
            onClick={onEditGoalClick}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px' }}>
              <Icon name="Edit" size={14} tint="var(--primary)" label="Editar Meta" />
              <div style={{ width: 4 }} />
              <T v="labelSmall" w="bold" color="var(--primary)">Ajustar</T>
            </div>
          </Surface>
        </div>

        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <T v="headlineMedium" w="extrabold" color={isGoalCompleted ? 'var(--break-green)' : 'var(--on-surface)'}>
                {fmt1(todayFocusHours)}
              </T>
              <T v="titleMedium" w="semibold" color="var(--on-surface-variant)" style={{ paddingBottom: 3, whiteSpace: 'pre' }}>
                {` / ${fmt1(goalHours)} h`}
              </T>
            </div>
            <T v="bodySmall" color="var(--on-surface-variant)">
              {`${todayFocusMinutes} de ${goalMinutes} minutos completados`}
            </T>
          </div>

          <Surface radius={10} color={isGoalCompleted ? alpha('var(--break-green)', 0.18) : alpha('var(--pomo-primary)', 0.15)}>
            <T v="titleMedium" w="bold" color={isGoalCompleted ? 'var(--break-green)' : 'var(--pomo-primary)'} style={{ display: 'block', padding: '4px 10px' }}>
              {`${progressPercent}%`}
            </T>
          </Surface>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ width: '100%', height: 14, borderRadius: 7, overflow: 'hidden', background: 'var(--surface-variant)' }}>
          <div
            className="dg-fill"
            style={{
              width: `${animatedProgress * 100}%`,
              background: isGoalCompleted
                ? 'linear-gradient(to right, var(--break-green), #059669, var(--pomo-accent-gold))'
                : 'linear-gradient(to right, var(--pomo-primary), var(--pomo-secondary))',
            }}
          />
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <T
            v="bodySmall"
            w={isGoalCompleted ? 'semibold' : 'normal'}
            color={isGoalCompleted ? 'var(--break-green)' : 'var(--on-surface-variant)'}
          >
            {status}
          </T>
        </div>
      </div>
    </Card>
  );
}

const PRESETS = [
  ['1.0 h', 60],
  ['1.5 h', 90],
  ['2.0 h', 120],
  ['3.0 h', 180],
  ['4.0 h', 240],
  ['5.0 h', 300],
];

export function DailyGoalSettingDialog({ currentGoalMinutes, onSaveGoal, onDismiss }) {
  const [selectedMinutes, setSelectedMinutes] = useState(Math.min(Math.max(currentGoalMinutes, 30), 480));
  const selectedHours = selectedMinutes / 60;

  let intensity;
  if (selectedMinutes <= 90) intensity = '💡 Meta ligera: Ideal para constancia y sesiones cortas sin agotamiento.';
  else if (selectedMinutes <= 180) intensity = '⚡ Meta equilibrada: Excelente ritmo diario para estudiantes o profesionales.';
  else if (selectedMinutes <= 300) intensity = '🔥 Meta intensiva: Alta productividad para días de exámenes o proyectos.';
  else intensity = '🏆 Meta Maratón: Máximo rendimiento de estudio profundo.';

  const chipRow = (items) => (
    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
      {items.map(([label, mins]) => (
        <PresetChip key={label} label={label} isSelected={selectedMinutes === mins} onClick={() => setSelectedMinutes(mins)} />
      ))}
    </div>
  );

  return (
    <div className="m3-scrim dg-scrim" onClick={onDismiss} role="presentation">
      <div onClick={(e) => e.stopPropagation()} style={{ width: '92%', maxWidth: 560, maxHeight: '100%', display: 'flex' }}>
        <Surface
          testId="daily_goal_dialog"
          radius={24}
          color="color-mix(in srgb, var(--surface-tint) 10.76%, var(--surface))"
          style={{ width: '100%' }}
        >
          <div className="dg-dialog" style={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: alpha('var(--pomo-primary)', 0.15),
                  }}
                >
                  <Icon name="TrackChanges" size={20} tint="var(--pomo-primary)" />
                </div>
                <div style={{ width: 10 }} />
                <T v="titleMedium" w="bold">Establecer Meta Diaria</T>
              </div>

              <IconButton onClick={onDismiss}>
                <Icon name="Close" label="Cerrar" />
              </IconButton>
            </div>

            <div style={{ height: 16 }} />

            <Card color={alpha('var(--primary-container)', 0.35)} radius={18} style={{ width: '100%' }}>
              <div style={{ width: '100%', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
                <T v="headlineMedium" w="extrabold" color="var(--pomo-primary)">{`${fmt1(selectedHours)} Horas`}</T>
                <T v="bodySmall" color="var(--on-surface-variant)">
                  {`(${selectedMinutes} minutos de estudio de enfoque al día)`}
                </T>
              </div>
            </Card>

            <div style={{ height: 18 }} />

            <T v="labelSmall" w="semibold" color="var(--on-surface-variant)" style={{ alignSelf: 'flex-start' }}>
              Selección Rápida de Metas:
            </T>

            <div style={{ height: 8 }} />
            {chipRow(PRESETS.slice(0, 3))}
            <div style={{ height: 8 }} />
            {chipRow(PRESETS.slice(3))}

            <div style={{ height: 18 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <T v="bodyMedium" w="semibold">Ajuste preciso:</T>
              <T v="titleMedium" w="bold" color="var(--pomo-primary)">{`${selectedMinutes}m`}</T>
            </div>

            <div style={{ width: '100%', '--primary': 'var(--pomo-primary)' }}>
              <Slider
                value={selectedMinutes}
                onChange={(v) => setSelectedMinutes(Math.trunc(Math.round(v) / 15) * 15)}
                min={30}
                max={480}
                steps={29}
                testId="goal_slider"
                label="Ajuste preciso de la meta diaria, en minutos"
              />
            </div>

            <div style={{ height: 8 }} />

            <T v="bodySmall" color="var(--on-surface-variant)" style={{ display: 'block', width: '100%', padding: '0 4px', boxSizing: 'border-box' }}>
              {intensity}
            </T>

            <div style={{ height: 22 }} />

            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <OutlinedButton onClick={onDismiss} radius={14} style={{ flex: 1 }}>
                Cancelar
              </OutlinedButton>

              <Button
                testId="save_daily_goal_button"
                onClick={() => {
                  onSaveGoal(selectedMinutes);
                  onDismiss();
                }}
                color="var(--pomo-primary)"
                radius={14}
                icon="Check"
                iconSize={16}
                style={{ flex: 1.3 }}
              >
                <span style={{ marginLeft: -2 }}>Guardar Meta</span>
              </Button>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function PresetChip({ label, isSelected, onClick }) {
  return (
    <Surface
      radius={12}
      color={isSelected ? 'var(--primary-container)' : alpha('var(--surface-variant)', 0.5)}
      onClick={onClick}
      style={{ flex: 1, minWidth: 0, ...(isSelected ? ring(1.5, 'var(--pomo-primary)') : null) }}
    >
      <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <T v="labelMedium" w={isSelected ? 'bold' : 'medium'} color={isSelected ? 'var(--pomo-primary)' : 'var(--on-surface)'}>
          {label}
        </T>
      </div>
    </Surface>
  );
}
