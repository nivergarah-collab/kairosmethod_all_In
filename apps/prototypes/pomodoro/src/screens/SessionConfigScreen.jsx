// Port de ui/session/SessionConfigScreen.kt
import React, { useState } from 'react';
import { useVM, useEffectiveDark } from '../useStore.jsx';
import { AlertType } from '../store.js';
import { Icon, Surface, Card, Button, OutlinedButton, OutlinedTextField, Slider, Switch, T, alpha } from '../m3.jsx';
import { UserSelectorBar } from '../components/CommonComponents.jsx';
import { DailyGoalSettingDialog } from '../components/DailyGoalComponents.jsx';
import banner from '../assets/img_study_banner.jpg';
import './session-config.css';

export const QuickTopicSuggestions = ['Programación', 'Matemáticas', 'Idiomas', 'Medicina', 'Derecho', 'Historia', 'Física', 'Diseño'];

const ring = (w, color) => ({ boxShadow: `inset 0 0 0 ${w}px ${color}` });
const hair = ring(1, alpha('var(--outline-variant)', 0.4));
const spacer = (h) => <div style={{ height: h }} />;
const hspacer = (w) => <div style={{ width: w, flex: 'none' }} />;

function SliderRow({ label, value, color, children }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <T v="bodyMedium" w="semibold" style={{ minWidth: 0 }}>{label}</T>
        <T v="titleMedium" w="bold" color={color} style={{ flex: 'none' }}>{value}</T>
      </div>
      {children}
    </>
  );
}

export function SessionConfigScreen({ onOpenUserDialog }) {
  const { state, vm } = useVM();
  const {
    activeUser, configTopic: topic, configSubtopic: subtopic, configBlocksCount: blocksCount, configWorkMinutes: workMinutes,
    configShortBreakMinutes: shortBreakMinutes, configLongBreakMinutes: longBreakMinutes, configBlockGoals: blockGoals,
    soundAlertsEnabled, vibrationAlertsEnabled,
  } = state;
  const isEffectiveDark = useEffectiveDark();

  const [showBlockGoalsCustomizer, setShowBlockGoalsCustomizer] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);

  const dailyGoal = activeUser?.dailyGoalMinutes ?? 120;

  return (
    <>
      <div className="sc-root" style={{ padding: '12px 18px', minHeight: '100%', boxSizing: 'border-box' }}>
        {/* Grupos de disposición: en celular no generan caja (display: contents); en tablet/PC forman 2 columnas (ver app.css) */}
        <div className="rs-grid">
        <div className="rs-col">
        <UserSelectorBar user={activeUser} onSwitchUserClick={onOpenUserDialog} />

        {spacer(10)}

        <Surface
          testId="config_daily_goal_card"
          tour="profile"
          radius={14}
          color={alpha('var(--surface-variant)', 0.5)}
          onClick={() => setShowGoalEditor(true)}
          style={{ width: '100%' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Icon name="TrackChanges" size={18} tint="var(--pomo-primary)" />
              {hspacer(8)}
              <T v="bodySmall" color="var(--on-surface-variant)">Meta de estudio para hoy:</T>
              {hspacer(6)}
              <T v="labelMedium" w="bold" color="var(--pomo-primary)">
                {`${(dailyGoal / 60).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h (${dailyGoal} min)`}
              </T>
            </div>

            <T v="labelSmall" w="bold" color="var(--primary)">Ajustar</T>
          </div>
        </Surface>

        {spacer(14)}

        <Card color="var(--surface)" radius={20} style={{ width: '100%' }}>
          <div style={{ position: 'relative', width: '100%', height: 130 }}>
            <img
              src={banner}
              alt="Espacio de estudio"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, #0F172ACC)' }} />
            <div style={{ position: 'absolute', left: 0, bottom: 0, padding: 14, display: 'flex', flexDirection: 'column' }}>
              <T v="titleMedium" w="bold" color="#FFFFFF">Configura tu Sesión Pomodoro</T>
              <T v="bodySmall" color="rgba(255,255,255,0.85)">Bloques enfocados y descansos inteligentes</T>
            </div>
          </div>
        </Card>

        {spacer(16)}

        <T v="titleSmall" w="bold" color="var(--on-surface)" style={{ display: 'block' }}>Plantillas Rápidas</T>

        {spacer(8)}

        <div className="sc-hscroll" data-tour="presets" style={{ gap: 10 }}>
          {vm.presets.map((preset) => {
            const isSelected =
              blocksCount === preset.blocks && workMinutes === preset.workMinutes && shortBreakMinutes === preset.shortBreakMinutes;
            return (
              <Surface
                key={preset.name}
                testId={`preset_${preset.name.replaceAll(' ', '_')}`}
                radius={14}
                color={isSelected ? 'var(--primary-container)' : 'var(--surface)'}
                onClick={() => vm.applyPreset(preset)}
                style={isSelected ? ring(2, 'var(--pomo-primary)') : hair}
              >
                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column' }}>
                  <T v="labelLarge" w="bold" color={isSelected ? 'var(--pomo-primary)' : 'var(--on-surface)'}>{preset.name}</T>
                  <T v="bodySmall" size={11} color="var(--on-surface-variant)">
                    {`${preset.blocks} bloques • ${preset.workMinutes}m/${preset.shortBreakMinutes}m`}
                  </T>
                </div>
              </Surface>
            );
          })}
        </div>

        {spacer(18)}

        <div data-tour="topic">
        <T v="titleSmall" w="bold" style={{ display: 'block' }}>Materia y Tema de Estudio</T>

        {spacer(8)}

        <OutlinedTextField
          testId="topic_input"
          value={topic}
          onChange={(v) => vm.setConfig({ topic: v })}
          label="Tema o Asignatura"
          placeholder="Ej. Álgebra Lineal, Medicina Interna, Inglés B2..."
          radius={14}
        />

        {spacer(8)}

        <div className="sc-hscroll" style={{ gap: 8 }}>
          {QuickTopicSuggestions.map((suggestion) => (
            <Surface
              key={suggestion}
              radius={20}
              color={alpha('var(--surface-variant)', 0.6)}
              onClick={() => vm.setConfig({ topic: suggestion })}
            >
              <T v="labelSmall" style={{ display: 'block', padding: '5px 10px' }}>{suggestion}</T>
            </Surface>
          ))}
        </div>

        {spacer(10)}

        <OutlinedTextField
          testId="subtopic_input"
          value={subtopic}
          onChange={(v) => vm.setConfig({ subtopic: v })}
          label="Subtema u Objetivo principal"
          placeholder="Ej. Resolver guía de ejercicios, Memorizar vocabulario..."
          radius={14}
        />
        </div>

        {spacer(20)}
        </div>

        <div className="rs-col">
        <Card tour="sliders" color="var(--surface)" radius={16} style={{ width: '100%', ...hair }}>
          <div style={{ padding: 16 }}>
            <SliderRow
              label="Número de bloques de estudio"
              value={`${blocksCount} ${blocksCount === 1 ? 'bloque' : 'bloques'}`}
              color="var(--pomo-primary)"
            >
              <Slider value={blocksCount} onChange={(v) => vm.setConfig({ blocksCount: Math.trunc(v) })} min={1} max={8} steps={6} testId="blocks_slider" />
            </SliderRow>

            {spacer(8)}

            <SliderRow label="Duración de cada bloque (Enfoque)" value={`${workMinutes} min`} color="var(--pomo-primary)">
              <Slider value={workMinutes} onChange={(v) => vm.setConfig({ workMinutes: Math.trunc(v) })} min={10} max={60} steps={9} testId="work_duration_slider" />
            </SliderRow>

            {spacer(8)}

            <SliderRow label="Descanso corto" value={`${shortBreakMinutes} min`} color="var(--break-green)">
              <Slider value={shortBreakMinutes} onChange={(v) => vm.setConfig({ shortBreakMinutes: Math.trunc(v) })} min={2} max={15} steps={12} />
            </SliderRow>

            {spacer(8)}

            <SliderRow label="Descanso largo (cada 4 bloques)" value={`${longBreakMinutes} min`} color="#0284C7">
              <Slider value={longBreakMinutes} onChange={(v) => vm.setConfig({ longBreakMinutes: Math.trunc(v) })} min={10} max={30} steps={3} />
            </SliderRow>
          </div>
        </Card>

        {spacer(16)}

        <Card testId="theme_switch_card" tour="prefs" color="var(--surface)" radius={16} style={{ width: '100%', ...hair }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 16, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 38, height: 38, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isEffectiveDark ? alpha('#6366F1', 0.22) : alpha('var(--pomo-accent-gold)', 0.2),
                }}
              >
                <Icon name={isEffectiveDark ? 'DarkMode' : 'LightMode'} size={22} tint={isEffectiveDark ? '#A5B4FC' : 'var(--pomo-accent-gold)'} />
              </div>

              {hspacer(12)}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <T v="titleSmall" w="bold">{isEffectiveDark ? 'Tema Oscuro (Modo Nocturno)' : 'Tema Claro'}</T>
                <T v="bodySmall" color="var(--on-surface-variant)">
                  {isEffectiveDark ? 'Confort visual en entornos con poca luz' : 'Ideal para estudiar con luz ambiental alta'}
                </T>
              </div>
            </div>

            <Switch
              testId="dark_mode_switch"
              checked={isEffectiveDark}
              onChange={(v) => vm.setDarkTheme(v)}
              thumbIcon={isEffectiveDark ? 'DarkMode' : 'LightMode'}
              colors={{
                checkedThumb: '#A5B4FC',
                checkedTrack: '#4338CA',
                uncheckedThumb: 'var(--pomo-accent-gold)',
                uncheckedTrack: 'var(--surface-variant)',
              }}
            />
          </div>
        </Card>

        {spacer(14)}

        <Card testId="alerts_settings_card" tour="prefs" color="var(--surface)" radius={16} style={{ width: '100%', ...hair }}>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: alpha('var(--pomo-accent-gold)', 0.18),
                }}
              >
                <Icon name="NotificationsActive" size={20} tint="var(--pomo-accent-gold)" />
              </div>

              {hspacer(12)}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <T v="titleSmall" w="bold">Alertas de Sonido y Vibración</T>
                <T v="bodySmall" color="var(--on-surface-variant)">Avisa cuando inicia o termina cada bloque</T>
              </div>
            </div>

            {spacer(14)}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Icon
                  name={soundAlertsEnabled ? 'VolumeUp' : 'NotificationsOff'}
                  size={20}
                  tint={soundAlertsEnabled ? 'var(--pomo-primary)' : 'var(--outline)'}
                />
                {hspacer(10)}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <T v="bodyMedium" w="semibold">Sonidos de notificación</T>
                  <T v="bodySmall" color="var(--on-surface-variant)">Campanas al iniciar y terminar el tiempo</T>
                </div>
              </div>

              <Switch
                testId="sound_alerts_switch"
                checked={soundAlertsEnabled}
                onChange={(v) => vm.setSoundAlerts(v)}
                colors={{ checkedThumb: '#FFFFFF', checkedTrack: 'var(--pomo-primary)' }}
              />
            </div>

            {spacer(10)}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Icon name="Vibration" size={20} tint={vibrationAlertsEnabled ? 'var(--pomo-primary)' : 'var(--outline)'} />
                {hspacer(10)}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <T v="bodyMedium" w="semibold">Vibración háptica</T>
                  <T v="bodySmall" color="var(--on-surface-variant)">Patrones de pulso distintivos</T>
                </div>
              </div>

              <Switch
                testId="vibration_alerts_switch"
                checked={vibrationAlertsEnabled}
                onChange={(v) => vm.setVibrationAlerts(v)}
                colors={{ checkedThumb: '#FFFFFF', checkedTrack: 'var(--pomo-primary)' }}
              />
            </div>

            {spacer(12)}

            <T v="labelSmall" w="semibold" color="var(--on-surface-variant)" style={{ display: 'block' }}>
              Probar alertas en este dispositivo:
            </T>

            {spacer(6)}

            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <OutlinedButton
                testId="test_sound_start_button"
                onClick={() => vm.testAlert(AlertType.BLOCK_BEGINS)}
                radius={10}
                style={{ flex: 1, minWidth: 0 }}
              >
                <span style={{ fontSize: 12 }}>🔔 Inicio de bloque</span>
              </OutlinedButton>

              <OutlinedButton
                testId="test_sound_end_button"
                onClick={() => vm.testAlert(AlertType.BLOCK_ENDS)}
                radius={10}
                style={{ flex: 1, minWidth: 0 }}
              >
                <span style={{ fontSize: 12 }}>⏰ Fin de bloque</span>
              </OutlinedButton>
            </div>
          </div>
        </Card>

        {spacer(14)}

        <Surface
          tour="blockgoals"
          radius={14}
          color={alpha('var(--surface-variant)', 0.5)}
          onClick={() => setShowBlockGoalsCustomizer(!showBlockGoalsCustomizer)}
          style={{ width: '100%' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 14, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <T v="titleSmall" w="bold">Personalizar objetivo por bloque</T>
              <T v="bodySmall" color="var(--on-surface-variant)">Opcional: detalla qué harás en cada bloque</T>
            </div>
            <Icon name={showBlockGoalsCustomizer ? 'ExpandLess' : 'ExpandMore'} />
          </div>
        </Surface>

        <div className={`sc-expand${showBlockGoalsCustomizer ? ' open' : ''}`}>
          <div>
            <div style={{ paddingTop: 10 }}>
              {Array.from({ length: Math.max(blocksCount, 0) }, (_, i) => i + 1).map((index) => (
                <div key={index} style={{ padding: '4px 0' }}>
                  <OutlinedTextField
                    value={blockGoals[index] ?? ''}
                    onChange={(v) => vm.setBlockGoal(index, v)}
                    label={`Objetivo del Bloque ${index}`}
                    placeholder={`Ej. Bloque ${index}: Resolver problemas 1 a 5`}
                    radius={12}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {spacer(24)}

        <Button
          testId="start_session_button"
          tour="start"
          onClick={() => vm.startSession()}
          color="var(--pomo-primary)"
          radius={16}
          height={54}
          icon="PlayArrow"
          iconSize={24}
          style={{ width: '100%' }}
        >
          <T v="titleMedium" w="bold">{`Iniciar Sesión de Estudio (${blocksCount * workMinutes} min)`}</T>
        </Button>

        {spacer(28)}
        </div>
        </div>
      </div>

      {showGoalEditor && (
        <DailyGoalSettingDialog
          currentGoalMinutes={dailyGoal}
          onSaveGoal={(newGoal) => vm.updateActiveUserDailyGoal(newGoal)}
          onDismiss={() => setShowGoalEditor(false)}
        />
      )}
    </>
  );
}
