// Primitivas Material 3 usadas por el APK. Las medidas son las de material3 1.3.0 (dp = px).
import React, { useId, useState } from 'react';
import { iconPaths } from './iconPaths.js';

const cx = (...a) => a.filter(Boolean).join(' ');

/** Icono Material. name: 'Check', 'Outlined.Tune', ... (mismos nombres que Icons.* de Compose). */
export function Icon({ name, size = 24, tint, style, className, label }) {
  const d = iconPaths[name];
  return (
    <svg
      className={cx('m3-icon', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ color: tint, ...style }}
      dangerouslySetInnerHTML={{ __html: d || '' }}
    />
  );
}

/** Surface (color por defecto: surface). radius en dp; border: string CSS; onClick lo vuelve clicable. */
export function Surface({ color, radius = 0, border, onClick, className, style, children, testId, as: As = 'div' }) {
  return (
    <As
      className={cx('m3-surface', onClick && 'm3-state', className)}
      onClick={onClick}
      data-testid={testId}
      style={{ background: color, borderRadius: radius, border, overflow: radius ? 'hidden' : undefined, ...style }}
    >
      {children}
    </As>
  );
}

/** Card: containerColor obligatorio en el APK (siempre lo pasa). Elevación 0dp por defecto. */
export function Card({ color, radius = 12, border, className, style, children, testId, onClick }) {
  return (
    <div
      className={cx('m3-card', onClick && 'm3-state', className)}
      onClick={onClick}
      data-testid={testId}
      style={{ background: color, borderRadius: radius, border, ...style }}
    >
      {children}
    </div>
  );
}

function buttonImpl(kind) {
  return function Btn({ onClick, color, contentColor, radius, height, icon, iconSize = 18, children, className, style, testId, disabled }) {
    return (
      <button
        type="button"
        className={cx('m3-btn', kind, icon && 'with-icon', className)}
        onClick={onClick}
        disabled={disabled}
        data-testid={testId}
        style={{ background: color, color: contentColor, borderRadius: radius, height, ...style }}
      >
        {icon && <Icon name={icon} size={iconSize} className="m3-btn-icon" />}
        {children}
      </button>
    );
  };
}
export const Button = buttonImpl('');
export const OutlinedButton = buttonImpl('outlined');
export const FilledTonalButton = buttonImpl('tonal');
export const TextButton = buttonImpl('text');

/** IconButton 48dp. */
export function IconButton({ onClick, children, className, style, testId, label }) {
  return (
    <button type="button" className={cx('m3-iconbtn', className)} onClick={onClick} data-testid={testId} aria-label={label} style={style}>
      {children}
    </button>
  );
}

/** OutlinedTextField de una línea. radius: shape en dp (por defecto 4dp = extraSmall). */
export function OutlinedTextField({ value, onChange, label, placeholder, radius = 4, className, style, testId, type = 'text', inputMode }) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const floated = focused || (value != null && value !== '');
  return (
    <div className={cx('m3-otf', floated && 'floated', focused && 'focused', className)} style={{ '--otf-radius': `${radius}px`, ...style }}>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        data-testid={testId}
        onChange={(e) => onChange?.(e.target.value)}
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

/** Slider con pasos: steps = marcas intermedias (igual que Compose), value/onChange en el rango [min,max]. */
export function Slider({ value, onChange, min, max, steps = 0, testId, className }) {
  const n = steps + 1; // intervalos
  const step = (max - min) / n;
  const p = (value - min) / (max - min);
  const ticks = Array.from({ length: n + 1 }, (_, i) => i / n);
  return (
    <div className={cx('m3-slider', className)} style={{ '--p': p, '--pct': `${p * 100}%` }}>
      <div className="track">
        <div className="active" />
        {steps > 0 &&
          ticks.map((t, i) => (
            <span
              key={i}
              className="tick"
              style={{ left: `${t * 100}%`, background: t <= p + 1e-9 ? 'color-mix(in srgb, var(--on-primary) 38%, transparent)' : 'color-mix(in srgb, var(--on-secondary-container) 38%, transparent)' }}
            />
          ))}
      </div>
      <div className="thumb" />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        data-testid={testId}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Switch. colors: { checkedThumb, checkedTrack, uncheckedThumb, uncheckedTrack }; thumbIcon: nombre de ícono (16dp). */
export function Switch({ checked, onChange, colors = {}, thumbIcon, testId }) {
  const thumb = checked ? colors.checkedThumb : colors.uncheckedThumb;
  const track = checked ? colors.checkedTrack : colors.uncheckedTrack;
  return (
    <span className={cx('m3-switch', checked && 'checked', thumbIcon && 'has-thumb-icon')}>
      <input type="checkbox" role="switch" checked={checked} data-testid={testId} onChange={(e) => onChange(e.target.checked)} />
      <span className="strack" style={{ background: track, borderColor: checked ? 'transparent' : colors.uncheckedBorder }} />
      <span className="sthumb" style={{ background: thumb, color: checked ? 'var(--on-primary-container)' : 'var(--surface-container-highest)' }}>
        {thumbIcon && <Icon name={thumbIcon} size={16} />}
      </span>
    </span>
  );
}

/** Dialog sin superficie propia (como androidx.compose.ui.window.Dialog): el contenido pone su Card/Surface. */
export function Dialog({ onDismiss, children, fullWidth }) {
  return (
    <div className="m3-scrim" onClick={onDismiss} role="presentation">
      <div onClick={(e) => e.stopPropagation()} style={{ width: fullWidth ? '100%' : undefined, maxWidth: fullWidth ? 560 : undefined, maxHeight: '100%', display: 'flex' }}>
        {children}
      </div>
    </div>
  );
}

/** AlertDialog de M3 (contenedor surfaceContainerHigh, forma 28dp). */
export function AlertDialog({ onDismiss, title, text, confirmButton, dismissButton, shape = 28, containerColor }) {
  return (
    <div className="m3-scrim" onClick={onDismiss} role="presentation">
      <div className="m3-alert" role="alertdialog" style={{ borderRadius: shape, background: containerColor }} onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="m3-alert-title">{title}</h2>}
        {text && <div className="m3-alert-text">{text}</div>}
        <div className="m3-alert-actions">
          {dismissButton}
          {confirmButton}
        </div>
      </div>
    </div>
  );
}

/** LinearProgressIndicator determinado: 4dp, extremos rectos. progress 0..1 */
export function LinearProgressIndicator({ progress, color, trackColor, height = 4, radius = 0, style }) {
  return (
    <div className="m3-linear" style={{ height, background: trackColor, borderRadius: radius, ...style }}>
      <i style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%`, background: color, borderRadius: radius }} />
    </div>
  );
}

export function HorizontalDivider({ color, style }) {
  return <hr className="m3-divider" style={{ background: color, ...style }} />;
}

/** Atajo de texto con estilo tipográfico M3: <T v="titleSmall" w="bold" color=...>. */
export function T({ v = 'bodyMedium', w, color, size, ls, lh, children, style, className, as: As = 'span', maxLines, ellipsis }) {
  return (
    <As
      className={cx(`t-${v}`, w && `w-${w}`, className)}
      style={{
        color,
        fontSize: size,
        letterSpacing: ls,
        lineHeight: lh,
        ...(maxLines
          ? { display: '-webkit-box', WebkitLineClamp: maxLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
          : null),
        ...(ellipsis && !maxLines ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : null),
        ...style,
      }}
    >
      {children}
    </As>
  );
}

/** Alfa sobre un color CSS (equivalente a Color.copy(alpha=a)). */
export const alpha = (color, a) => `color-mix(in srgb, ${color} ${Math.round(a * 1000) / 10}%, transparent)`;
