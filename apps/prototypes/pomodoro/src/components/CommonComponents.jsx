// Port de ui/components/CommonComponents.kt
import React from 'react';
import { Icon, IconButton, Surface, Card, T, alpha } from '../m3.jsx';
import { TimerPhase, phaseDisplayName } from '../store.js';

const parseColor = (hex, fallback = 'var(--primary)') => (/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex || '') ? hex : fallback);

export function UserSelectorBar({ user, onSwitchUserClick }) {
  return (
    <Surface
      testId="user_selector_bar"
      tour="profile"
      onClick={onSwitchUserClick}
      radius={16}
      color={alpha('var(--surface-variant)', 0.7)}
      style={{ width: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: '50%', background: parseColor(user?.colorHex ?? '#E04F36'),
              display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: '28px' }}>{user?.avatarEmoji ?? '👤'}</span>
          </div>
          <div style={{ width: 12, flex: 'none' }} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <T v="labelSmall" color="var(--on-surface-variant)">Perfil activo</T>
            <T v="titleMedium" w="bold" ellipsis>{user?.name ?? 'Sin usuario'}</T>
          </div>
        </div>
        <div style={{ borderRadius: 20, background: alpha('var(--primary)', 0.15), marginLeft: 8, flex: 'none' }}>
          <T v="labelMedium" w="semibold" color="var(--primary)" style={{ display: 'block', padding: '6px 12px' }}>Cambiar</T>
        </div>
      </div>
    </Surface>
  );
}

const PHASE_COLOR = {
  [TimerPhase.FOCUS]: 'var(--pomo-primary)',
  [TimerPhase.SHORT_BREAK]: 'var(--break-green)',
  [TimerPhase.LONG_BREAK]: '#0284C7',
  [TimerPhase.FINISHED]: 'var(--pomo-accent-gold)',
};

/** Canvas 232x232 (260 - 2*14 de padding), trazo 14dp, arco desde las 12 en punto con extremos redondos y degradado de barrido. */
export function PomodoroTimerArc({ phase, secondsRemaining, totalSeconds, isRunning }) {
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, secondsRemaining / totalSeconds)) : 0;
  const phaseColor = PHASE_COLOR[phase];
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const size = 232, stroke = 14, d = size - stroke, r = d / 2, c = size / 2;
  const sweep = 360 * progress;
  const pt = (deg) => [c + r * Math.cos((deg * Math.PI) / 180), c + r * Math.sin((deg * Math.PI) / 180)];
  let arcPath = '';
  if (sweep > 0.0001) {
    if (sweep >= 359.999) {
      const [x1, y1] = pt(-90), [x2, y2] = pt(90);
      arcPath = `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2} A ${r} ${r} 0 1 1 ${x1} ${y1}`;
    } else {
      const [x1, y1] = pt(-90), [x2, y2] = pt(-90 + sweep);
      arcPath = `M ${x1} ${y1} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2}`;
    }
  }
  const mask = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><path d='${arcPath}' fill='none' stroke='white' stroke-width='${stroke}' stroke-linecap='round'/></svg>`,
  )}")`;
  // Brush.sweepGradient(listOf(phase.8, phase, secondary, phase)): 0° = las 3 en punto, giro horario
  const sweepGradient = `conic-gradient(from 90deg, ${alpha(phaseColor, 0.8)} 0%, ${phaseColor} 33.333%, var(--pomo-secondary) 66.666%, ${phaseColor} 100%)`;

  return (
    <div style={{ position: 'relative', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 14 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke={alpha(phaseColor, 0.15)} strokeWidth={stroke} />
        </svg>
        {arcPath && (
          <div style={{ position: 'absolute', inset: 0, background: sweepGradient, WebkitMaskImage: mask, maskImage: mask, borderRadius: '50%' }} />
        )}
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ borderRadius: 12, background: alpha(phaseColor, 0.18), marginBottom: 6 }}>
          <T v="labelSmall" w="bold" color={phaseColor} ls="1.2px" style={{ display: 'block', padding: '4px 10px' }}>
            {phaseDisplayName[phase].toUpperCase()}
          </T>
        </div>
        <T v="displayLarge" w="extrabold" size={52} color="var(--on-surface)">{timeFormatted}</T>
        <T v="bodySmall" color={isRunning ? phaseColor : 'var(--on-surface-variant)'}>{isRunning ? 'En progreso' : 'Pausado'}</T>
      </div>
    </div>
  );
}

export function BlockTimelineCard({ index, title, goal, durationMinutes, isCurrent, isCompleted, onToggleCompleted }) {
  const container = isCompleted
    ? alpha('var(--surface-variant)', 0.5)
    : isCurrent
      ? alpha('var(--primary-container)', 0.35)
      : 'var(--surface)';
  return (
    <Card
      testId={`block_card_${index}`}
      color={container}
      radius={14}
      border={isCurrent ? '2px solid var(--pomo-primary)' : `1px solid ${alpha('var(--outline-variant)', 0.5)}`}
      style={{ width: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isCompleted ? 'var(--break-green)' : isCurrent ? 'var(--pomo-primary)' : 'var(--surface-variant)',
            }}
          >
            <T v="titleSmall" w="bold" color={isCompleted || isCurrent ? '#FFFFFF' : 'var(--on-surface-variant)'}>{index}</T>
          </div>
          <div style={{ width: 12, flex: 'none' }} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <T v="titleSmall" w="bold" color="var(--on-surface)">{title}</T>
              {isCurrent && (
                <>
                  <span style={{ width: 6 }} />
                  <span style={{ borderRadius: 6, background: 'var(--pomo-primary)', display: 'inline-block' }}>
                    <T v="labelSmall" w="bold" size={9} color="#FFFFFF" style={{ display: 'block', padding: '2px 6px' }}>ACTUAL</T>
                  </span>
                </>
              )}
            </div>
            <T v="bodySmall" color="var(--on-surface-variant)" ellipsis>{goal.trim() !== '' ? goal : `${durationMinutes} min de estudio`}</T>
          </div>
        </div>
        <IconButton testId={`toggle_block_${index}`} onClick={onToggleCompleted} label={isCompleted ? 'Completado' : 'Marcar como completado'}>
          <Icon
            name={isCompleted ? 'CheckCircle' : 'Outlined.CheckCircleOutline'}
            size={28}
            tint={isCompleted ? 'var(--break-green)' : 'var(--outline)'}
          />
        </IconButton>
      </div>
    </Card>
  );
}

export function StatCard({ title, value, subtitle, accentColor, style }) {
  return (
    <Card color="var(--surface)" radius={16} border={`1px solid ${alpha('var(--outline-variant)', 0.4)}`} style={style}>
      <div style={{ padding: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor }} />
        <div style={{ height: 8 }} />
        <T v="headlineSmall" w="extrabold" color="var(--on-surface)" as="div">{value}</T>
        <T v="labelMedium" w="semibold" color="var(--on-surface)" as="div">{title}</T>
        <T v="bodySmall" size={11} color="var(--on-surface-variant)" as="div">{subtitle}</T>
      </div>
    </Card>
  );
}

export function SimpleBarChart({ values, labels, primaryColor = 'var(--pomo-primary)', style }) {
  if (values.length === 0) {
    return (
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        <T v="bodyMedium" color="var(--on-surface-variant)">Sin registros recientes para graficar</T>
      </div>
    );
  }
  const maxValue = Math.max(Math.max(...values), 1);
  return (
    <div style={style}>
      <div style={{ display: 'flex', width: '100%', height: 130, padding: '0 8px', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {values.map((value, i) => {
          const fraction = Math.min(1, Math.max(0.05, value / maxValue));
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <T v="labelSmall" size={10} color="var(--on-surface-variant)">{`${Math.trunc(value)}m`}</T>
              <div style={{ height: 4 }} />
              <div
                style={{
                  width: 18, height: 100 * fraction, borderRadius: '6px 6px 0 0',
                  background: `linear-gradient(to bottom, ${primaryColor}, ${alpha(primaryColor, 0.5)})`,
                }}
              />
              <div style={{ height: 4 }} />
              <T v="labelSmall" size={10} color="var(--on-surface)" style={{ whiteSpace: 'nowrap' }}>{labels[i] ?? `${i}`}</T>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RatingStarBar({ rating, onRatingChange, style }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <IconButton key={star} testId={`star_${star}`} onClick={() => onRatingChange(star)} label={`${star} estrellas`}>
          <Icon name={star <= rating ? 'Star' : 'Outlined.StarOutline'} size={32} tint={star <= rating ? 'var(--pomo-accent-gold)' : 'var(--outline)'} />
        </IconButton>
      ))}
    </div>
  );
}
