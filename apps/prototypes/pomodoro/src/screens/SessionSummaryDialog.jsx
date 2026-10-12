import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { Dialog, Surface, Card, Button, OutlinedButton, Icon, T, alpha } from '../m3.jsx';
import { RatingStarBar } from '../components/CommonComponents.jsx';
import './session-summary.css';

/** OutlinedTextField multilínea (minLines = 3, maxLines = 5, forma 14dp). */
function NotesField({ value, onChange, label, placeholder, radius, testId }) {
  const id = useId();
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  const floated = focused || value !== '';

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(152, Math.max(104, el.scrollHeight))}px`;
  }, [value]);

  return (
    <div
      className={`m3-otf ssd-notes${floated ? ' floated' : ''}${focused ? ' focused' : ''}`}
      style={{ '--otf-radius': `${radius}px`, width: '100%' }}
    >
      <textarea
        id={id}
        ref={ref}
        rows={3}
        value={value}
        placeholder={placeholder}
        data-testid={testId}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <label htmlFor={id}>{label}</label>
      <fieldset aria-hidden="true">
        <legend>
          <span>{label}</span>
        </legend>
      </fieldset>
    </div>
  );
}

function StatMiniItem({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <T v="titleLarge" w="bold" color={color} as="div">{value}</T>
      <T v="labelSmall" color="var(--on-surface-variant)" as="div">{label}</T>
    </div>
  );
}

export function SessionSummaryDialog({ summary, onSaveSession, onDismiss }) {
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);

  const focusMins = Math.trunc(summary.focusSeconds / 60);
  const breakMins = Math.trunc(summary.breakSeconds / 60);
  const percentage = Math.trunc(summary.completionRate * 100);

  return (
    <Dialog onDismiss={onDismiss} fullWidth>
      {/* Surface 24dp, surface + tonalElevation 6dp (superposición de surfaceTint al 10.75 %) */}
      <Surface
        testId="session_summary_dialog"
        radius={24}
        color="color-mix(in srgb, var(--surface-tint) 10.75%, var(--surface))"
        style={{ width: '100%', display: 'flex', maxHeight: '100%' }}
      >
        <div
          style={{
            boxSizing: 'border-box', width: '100%', padding: 22, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
        >
          {/* Header badge */}
          <div style={{ width: 56, height: 56, flex: 'none', borderRadius: '50%', background: alpha('var(--pomo-accent-gold)', 0.2), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="EmojiEvents" size={32} tint="var(--pomo-accent-gold)" label="Trofeo" />
          </div>

          <div style={{ height: 12, flex: 'none' }} />

          <T v="headlineSmall" w="bold" color="var(--on-surface)" as="div">¡Sesión Terminada!</T>

          <T v="bodyMedium" color="var(--on-surface-variant)" as="div">{`${summary.topic} • ${summary.subtopic}`}</T>

          <div style={{ height: 18, flex: 'none' }} />

          {/* Stats grid */}
          <Card color={alpha('var(--surface-variant)', 0.5)} radius={16} style={{ width: '100%', flex: 'none' }}>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <StatMiniItem label="Tiempo Enfoque" value={`${focusMins}m`} color="var(--pomo-primary)" />
                <StatMiniItem label="Descanso" value={`${breakMins}m`} color="var(--break-green)" />
                <StatMiniItem label="Bloques" value={`${summary.blocksCompleted}/${summary.totalBlocksPlanned}`} color="var(--pomo-accent-gold)" />
              </div>

              <div style={{ height: 10 }} />

              {/* Success rate bar */}
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <T v="labelMedium" color="var(--on-surface-variant)">Completado:</T>
                <div style={{ width: 8, flex: 'none' }} />
                <T v="labelLarge" w="bold" color={percentage >= 80 ? 'var(--break-green)' : 'var(--pomo-primary)'}>{`${percentage}%`}</T>
              </div>
            </div>
          </Card>

          <div style={{ height: 16, flex: 'none' }} />

          <T v="labelLarge" w="semibold" color="var(--on-surface)" as="div">¿Cómo estuvo tu enfoque?</T>

          <RatingStarBar rating={rating} onRatingChange={setRating} style={{ padding: '6px 0' }} />

          <div style={{ height: 10, flex: 'none' }} />

          <NotesField
            value={notes}
            onChange={setNotes}
            label="¿Qué lograste o aprendiste hoy?"
            placeholder="Escribe tus reflexiones o notas del estudio..."
            radius={14}
            testId="summary_notes_input"
          />

          <div style={{ height: 20, flex: 'none' }} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, width: '100%', flex: 'none' }}>
            <OutlinedButton testId="discard_summary_button" onClick={onDismiss} radius={14} style={{ flex: '1 1 0', minWidth: 0 }}>
              <Icon name="Close" size={16} />
              <div style={{ width: 6, flex: 'none' }} />
              <T v="labelLarge">Descartar</T>
            </OutlinedButton>

            <Button testId="save_session_button" onClick={() => onSaveSession(notes, rating)} color="var(--pomo-primary)" radius={14} style={{ flex: '1.3 1 0', minWidth: 0 }}>
              <Icon name="Check" size={16} />
              <div style={{ width: 6, flex: 'none' }} />
              <T v="labelLarge">Guardar Registro</T>
            </Button>
          </div>
        </div>
      </Surface>
    </Dialog>
  );
}
