import React, { useState } from 'react';
import { useVM, useEffectiveDark } from '../useStore.jsx';
import { TimerPhase } from '../store.js';
import { PomodoroTimerArc, BlockTimelineCard } from '../components/CommonComponents.jsx';
import { Icon, Surface, Card, Button, OutlinedButton, FilledTonalButton, TextButton, AlertDialog, T, alpha } from '../m3.jsx';

const INDIGO = '#6366F1';
const INDIGO_LIGHT = '#A5B4FC';

/** Pastilla de acceso rápido (Surface 12dp con borde 1dp, clicable, Row con padding 10x5). */
function QuickPill({ testId, onClick, color, borderColor, icon, iconTint, label, labelColor }) {
  return (
    <Surface testId={testId} onClick={onClick} color={color} radius={12} border={`1px solid ${borderColor}`}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '5px 10px' }}>
        <Icon name={icon} size={16} tint={iconTint} />
        <div style={{ width: 6, flex: 'none' }} />
        <T v="labelSmall" w="semibold" color={labelColor}>{label}</T>
      </div>
    </Surface>
  );
}

export function ActiveTimerScreen() {
  const { state, vm } = useVM();
  const isEffectiveDark = useEffectiveDark();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    isSessionActive, isTimerRunning, currentPhase, secondsRemaining, phaseTotalSeconds, currentBlockIndex, activeBlocks,
    configTopic: topic, configSubtopic: subtopic, soundAlertsEnabled, vibrationAlertsEnabled,
  } = state;

  if (!isSessionActive) {
    // Idle screen when no session is running
    return (
      <div style={{ boxSizing: 'border-box', width: '100%', height: '100%', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="Flag" size={40} tint="var(--on-surface-variant)" />
          </div>
          <div style={{ height: 16 }} />
          <T v="titleLarge" w="bold" color="var(--on-surface)">No hay sesión en curso</T>
          <T v="bodyMedium" color="var(--on-surface-variant)" as="div" style={{ textAlign: 'center', padding: '8px 20px' }}>
            Ve a la pestaña 'Configurar' para preparar tus bloques de estudio y comenzar.
          </T>
          <div style={{ height: 16 }} />
          <Button onClick={() => vm.setTab(0)} color="var(--pomo-primary)" radius={14}>Configurar Nueva Sesión</Button>
        </div>
      </div>
    );
  }

  const currentBlock = activeBlocks.find((b) => b.index === currentBlockIndex);

  return (
    <div className="at-root" style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 18px' }}>
      {/* Grupos de disposición: en celular no generan caja (display: contents); en tablet/PC forman 2 columnas (ver app.css) */}
      <div className="rs-grid">
      <div className="rs-col">
      {/* Header with Session Topic */}
      <Card color={alpha('var(--surface-variant)', 0.5)} radius={16} style={{ width: '100%', margin: '4px 0', boxSizing: 'border-box' }}>
        <div style={{ boxSizing: 'border-box', width: '100%', padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <T v="titleLarge" w="extrabold" color="var(--on-surface)" as="div" style={{ textAlign: 'center' }}>
            {topic.trim() === '' ? 'Tema General' : topic}
          </T>
          <T v="bodyMedium" color="var(--on-surface-variant)" as="div" style={{ textAlign: 'center' }}>
            {subtopic.trim() === '' ? 'Sesión de Estudio' : subtopic}
          </T>

          <div style={{ height: 10 }} />

          {/* Quick Audio & Vibration Alert Toggles in Active Session */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QuickPill
              testId="quick_toggle_sound"
              onClick={() => vm.toggleSoundAlerts()}
              color={soundAlertsEnabled ? alpha('var(--pomo-primary)', 0.15) : 'var(--surface)'}
              borderColor={soundAlertsEnabled ? 'var(--pomo-primary)' : 'var(--outline-variant)'}
              icon={soundAlertsEnabled ? 'VolumeUp' : 'VolumeOff'}
              iconTint={soundAlertsEnabled ? 'var(--pomo-primary)' : 'var(--outline)'}
              label={soundAlertsEnabled ? 'Sonido ON' : 'Silenciado'}
              labelColor={soundAlertsEnabled ? 'var(--pomo-primary)' : 'var(--outline)'}
            />
            <QuickPill
              testId="quick_toggle_vibration"
              onClick={() => vm.toggleVibrationAlerts()}
              color={vibrationAlertsEnabled ? alpha('var(--break-green)', 0.15) : 'var(--surface)'}
              borderColor={vibrationAlertsEnabled ? 'var(--break-green)' : 'var(--outline-variant)'}
              icon="Vibration"
              iconTint={vibrationAlertsEnabled ? 'var(--break-green)' : 'var(--outline)'}
              label={vibrationAlertsEnabled ? 'Vibración' : 'Sin vibrar'}
              labelColor={vibrationAlertsEnabled ? 'var(--break-green)' : 'var(--outline)'}
            />
            {/* Theme Mode Quick Toggle Pill */}
            <QuickPill
              testId="quick_toggle_theme"
              onClick={() => vm.toggleDarkTheme(isEffectiveDark)}
              color={isEffectiveDark ? alpha(INDIGO, 0.18) : 'var(--surface)'}
              borderColor={isEffectiveDark ? INDIGO_LIGHT : 'var(--outline-variant)'}
              icon={isEffectiveDark ? 'DarkMode' : 'LightMode'}
              iconTint={isEffectiveDark ? INDIGO_LIGHT : 'var(--pomo-accent-gold)'}
              label={isEffectiveDark ? 'Oscuro' : 'Claro'}
              labelColor={isEffectiveDark ? INDIGO_LIGHT : 'var(--on-surface-variant)'}
            />
          </div>
        </div>
      </Card>

      <div style={{ height: 8 }} />

      {/* Timer display arc */}
      <div style={{ padding: '8px 0' }}>
        <PomodoroTimerArc phase={currentPhase} secondsRemaining={secondsRemaining} totalSeconds={phaseTotalSeconds} isRunning={isTimerRunning} />
      </div>

      <div style={{ height: 12 }} />

      {/* Primary Timer Controls Row */}
      <div style={{ boxSizing: 'border-box', width: '100%', padding: '0 8px', display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
        {/* +5 min button */}
        <FilledTonalButton onClick={() => vm.addMinutes(5)} radius="50%" height={52} style={{ width: 52, padding: 0 }}>
          <T v="labelLarge" w="bold" size={13}>+5m</T>
        </FilledTonalButton>

        {/* Play / Pause main button */}
        <Button
          testId="play_pause_button"
          onClick={() => vm.togglePlayPause()}
          radius="50%"
          height={72}
          color={currentPhase === TimerPhase.FOCUS ? 'var(--pomo-primary)' : 'var(--break-green)'}
          style={{ width: 72, padding: 0 }}
        >
          <Icon name={isTimerRunning ? 'Pause' : 'PlayArrow'} size={36} label={isTimerRunning ? 'Pausar' : 'Reanudar'} />
        </Button>

        {/* Skip phase button */}
        <FilledTonalButton testId="skip_phase_button" onClick={() => vm.skipCurrentPhase()} radius="50%" height={52} style={{ width: 52, padding: 0 }}>
          <Icon name="SkipNext" size={24} label="Siguiente fase" />
        </FilledTonalButton>
      </div>

      <div style={{ height: 18 }} />
      </div>

      <div className="rs-col">
      {/* Current block quick action banner */}
      {currentBlock != null && (
        <Card
          testId="current_block_banner"
          color={currentBlock.isCompleted ? alpha('var(--break-green)', 0.15) : alpha('var(--pomo-primary)', 0.12)}
          border={`1.5px solid ${currentBlock.isCompleted ? 'var(--break-green)' : 'var(--pomo-primary)'}`}
          radius={18}
          style={{ width: '100%', boxSizing: 'border-box' }}
        >
          <div style={{ boxSizing: 'border-box', width: '100%', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <T v="labelMedium" w="bold" color={currentBlock.isCompleted ? 'var(--break-green)' : 'var(--pomo-primary)'} as="div">
                  {`Bloque ${currentBlock.index} de ${activeBlocks.length}`}
                </T>
                <T v="titleMedium" w="semibold" color="var(--on-surface)" as="div" maxLines={2}>
                  {currentBlock.goal.trim() === '' ? 'Estudio y concentración profunda' : currentBlock.goal}
                </T>
              </div>
            </div>

            <div style={{ height: 10 }} />

            {/* Button to mark current block completed immediately! */}
            <Button
              testId="mark_block_completed_button"
              onClick={() => vm.markCurrentBlockCompleted()}
              color={currentBlock.isCompleted ? 'var(--break-green)' : 'var(--pomo-primary)'}
              radius={12}
              height={46}
              style={{ width: '100%' }}
            >
              <Icon name={currentBlock.isCompleted ? 'Check' : 'DoneAll'} size={18} />
              <div style={{ width: 8, flex: 'none' }} />
              <T v="labelLarge" w="bold">{currentBlock.isCompleted ? '¡Bloque marcado como Completado!' : 'Marcar bloque como completado'}</T>
            </Button>
          </div>
        </Card>
      )}

      <div style={{ height: 20 }} />

      {/* Action row: End session or cancel */}
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <OutlinedButton onClick={() => setShowCancelDialog(true)} radius={14} style={{ flex: '1 1 0', minWidth: 0 }}>
          <Icon name="Close" size={16} />
          <div style={{ width: 6, flex: 'none' }} />
          <T v="labelLarge">Cancelar</T>
        </OutlinedButton>

        <Button testId="finish_session_now_button" onClick={() => vm.finishSessionPrompt()} color="var(--pomo-accent-gold)" contentColor="#000000" radius={14} style={{ flex: '1.3 1 0', minWidth: 0 }}>
          <Icon name="Flag" size={16} tint="#000000" />
          <div style={{ width: 6, flex: 'none' }} />
          <T v="labelLarge" w="bold" color="#000000">Finalizar y Guardar</T>
        </Button>
      </div>

      <div style={{ height: 24 }} />

      {/* Blocks Timeline header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <T v="titleMedium" w="bold" color="var(--on-surface)">Progreso de Bloques</T>
        <T v="labelLarge" w="bold" color="var(--break-green)">{`${activeBlocks.filter((b) => b.isCompleted).length}/${activeBlocks.length} hechos`}</T>
      </div>

      <div style={{ height: 8 }} />

      {/* List of all session blocks */}
      {activeBlocks.map((block) => (
        <div key={block.index} style={{ width: '100%', padding: '4px 0' }}>
          <BlockTimelineCard
            index={block.index}
            title={block.title}
            goal={block.goal}
            durationMinutes={block.durationMinutes}
            isCurrent={block.index === currentBlockIndex}
            isCompleted={block.isCompleted}
            onToggleCompleted={() => vm.toggleBlockCompletion(block.index)}
          />
        </div>
      ))}

      <div style={{ height: 32 }} />
      </div>
      </div>

      {showCancelDialog && (
        <AlertDialog
          onDismiss={() => setShowCancelDialog(false)}
          title="¿Cancelar sesión actual?"
          text="Si cancelas ahora, no se guardarán las estadísticas de esta sesión en tu registro."
          confirmButton={
            <TextButton
              onClick={() => {
                setShowCancelDialog(false);
                vm.cancelSession();
              }}
            >
              <span style={{ color: 'var(--error)' }}>Sí, cancelar</span>
            </TextButton>
          }
          dismissButton={<TextButton onClick={() => setShowCancelDialog(false)}>Continuar estudiando</TextButton>}
        />
      )}
    </div>
  );
}
