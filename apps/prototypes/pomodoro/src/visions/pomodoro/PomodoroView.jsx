import React, { useEffect, useMemo, useState } from 'react';
import { useVM, useEffectiveDark } from '../../useStore.jsx';
import {
  ETIQUETAS_FASE, avanceFase, bloquesHechos, consejo, duracion, estadoTexto, horaDelDia, iconoHref, minutosPlanificados,
  reloj, segundosRestantesSesion, siguiente, tituloPestana, tonoDe,
} from './model.js';
import { tokensPara } from './colores.js';
import { useTemaVision } from '../tema/TemaVision.jsx';
import './pomodoro.css';

const R = 46;
const C = 2 * Math.PI * R;

function Anillo({ avance, tono, children }) {
  return (
    <div className={`vp-anillo vp-${tono}`}>
      <svg viewBox="0 0 100 100" className="vp-anillo-svg" aria-hidden="true" focusable="false">
        <circle className="vp-pista" cx="50" cy="50" r={R} />
        <circle className="vp-barra" cx="50" cy="50" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - avance)} transform="rotate(-90 50 50)" />
      </svg>
      <div className="vp-anillo-centro">{children}</div>
    </div>
  );
}

// Título e icono de la pestaña con la cuenta atrás (se restauran al salir de la visión).
function usePestana(state, activo) {
  const tono = tonoDe(state.currentPhase);
  const av = Math.round(avanceFase(state) * 50) / 50;
  const titulo = activo ? tituloPestana(state, 'PomoStudy') : null;
  useEffect(() => {
    if (!activo) return undefined;
    const anterior = document.title;
    return () => { document.title = anterior; };
  }, [activo]);
  useEffect(() => { if (titulo) document.title = titulo; }, [titulo]);
  useEffect(() => {
    if (!activo) return undefined;
    let link = document.querySelector('link[rel~="icon"]');
    const creado = !link;
    if (creado) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    const hrefAnterior = link.getAttribute('href');
    const tipoAnterior = link.getAttribute('type');
    link.setAttribute('type', 'image/svg+xml');
    link.setAttribute('href', iconoHref(av, tono));
    return () => {
      if (creado) link.remove();
      else { if (hrefAnterior === null) link.removeAttribute('href'); else link.setAttribute('href', hrefAnterior); if (tipoAnterior === null) link.removeAttribute('type'); else link.setAttribute('type', tipoAnterior); }
    };
  }, [activo, av, tono]);
}

/**
 * Visión Pomodoro: capa de presentación sobre el contrato de sesión (adaptada del prototipo «pomodoro»).
 * Anillo con el reloj, controles redondos, consejos en los descansos, línea de bloques, modo enfoque y atajos.
 * Sonido, vibración y avisos del navegador son los comunes de la app; el guardado y las estadísticas, los del contrato.
 */
export function PomodoroView() {
  const { state, vm } = useVM();
  const oscuro = useEffectiveDark();
  const tema = useTemaVision('pomodoro');
  const [zen, setZen] = useState(false);
  const [confirma, setConfirma] = useState(false);
  const activa = state.isSessionActive && !state.showSummaryDialog && !state.isReviewing;
  usePestana(state, activa);

  useEffect(() => { if (!state.isSessionActive) { setZen(false); setConfirma(false); } }, [state.isSessionActive]);

  // Atajos: Espacio, S, R, N, F y Esc. No actúan en campos de texto ni con un diálogo abierto.
  useEffect(() => {
    const f = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === 'Escape') { if (zen) setZen(false); else if (confirma) setConfirma(false); return; }
      if (!state.isSessionActive || state.isReviewing || document.querySelector('[role="dialog"]')) return;
      if (e.key === ' ') { if (tag === 'BUTTON') return; e.preventDefault(); vm.togglePlayPause(); return; }
      const k = e.key.toLowerCase();
      if (k === 's') vm.skipCurrentPhase();
      else if (k === 'r') vm.restartPhase();
      else if (k === 'n' && state.currentPhase === 'FOCUS') vm.toggleBlockCompletion(state.currentBlockIndex);
      else if (k === 'f') setZen((z) => !z);
    };
    document.addEventListener('keydown', f);
    return () => document.removeEventListener('keydown', f);
  });

  const vars = useMemo(() => ({ ...tokensPara(oscuro), ...tema.vars }), [oscuro, tema.vars]);

  if (!state.isSessionActive) {
    return (
      <section className="vp" style={vars} aria-label="Visión Pomodoro">
        <div className="vp-capa"><h1 className="vp-titulo">No hay una sesión en curso</h1><p className="vp-suave">Vuelve a Configurar para preparar tus bloques.</p></div>
      </section>
    );
  }

  const tono = tonoDe(state.currentPhase);
  const total = state.activeBlocks.length;
  const hechos = bloquesHechos(state);
  const bloque = state.activeBlocks[state.currentBlockIndex - 1];
  const sig = siguiente(state);
  const corriendo = state.isTimerRunning;
  const meta = bloque && bloque.goal !== `${state.activeConfig.topic}: ${state.activeConfig.subtopic}` ? bloque.goal : '';
  const fin = horaDelDia(Date.now() + segundosRestantesSesion(state) * 1000);
  const descanso = tono === 'rest';

  return (
    <section className={`vp${zen ? ' vp-zen' : ''}`} style={vars} aria-label="Visión Pomodoro" data-testid="vision_pomodoro">
      {zen && <button type="button" className="vp-chip vp-salir-zen" onClick={() => setZen(false)} aria-label="Salir del modo enfoque" data-testid="exit_focus_mode">Salir del modo enfoque</button>}
      <div className="vp-capa">
        {tema.panel}
        <div className="vp-layout">
          <div className="vp-principal" role="region" aria-label="Temporizador">
            <p className="vp-eyebrow">Bloque {state.currentBlockIndex} de {total}</p>
            {zen && (
              <p className="vp-puntos" role="img" aria-label={`Bloque ${state.currentBlockIndex} de ${total}, ${hechos} hechos`}>
                {state.activeBlocks.map((b) => <span key={b.index} className={`vp-punto${b.isCompleted ? ' vp-hecho' : ''}${b.index === state.currentBlockIndex ? ' vp-actual' : ''}`} />)}
              </p>
            )}
            <h1 className="vp-titulo">{state.activeConfig.topic}<span> · {state.activeConfig.subtopic}</span></h1>

            <Anillo avance={avanceFase(state)} tono={tono}>
              <span className={`vp-pildora vp-pildora-${tono}`}>{ETIQUETAS_FASE[state.currentPhase]}</span>
              <span className="vp-reloj" role="timer" aria-live="off" aria-label={`Quedan ${reloj(state.secondsRemaining)}`}>{reloj(state.secondsRemaining)}</span>
              <span className="vp-estado">{estadoTexto(state)}</span>
            </Anillo>

            <p className="vp-sigue">
              {sig ? `Sigue: ${ETIQUETAS_FASE[sig.fase].toLowerCase()} · ${sig.minutos} min` : 'Último tramo de la sesión'}
              {corriendo && <span className="vp-fin"> · Termina a las {fin}</span>}
            </p>
            {meta && <p className="vp-meta">{meta}</p>}
            {descanso && <p className="vp-consejo">{consejo(state.currentBlockIndex)}</p>}

            <div className="vp-controles" role="group" aria-label="Controles del temporizador">
              <button type="button" className="vp-redondo" onClick={() => vm.restartPhase()} aria-label="Reiniciar fase" title="Reiniciar fase (R)" aria-keyshortcuts="R">⟲</button>
              <button type="button" className={`vp-jugar vp-jugar-${tono}`} onClick={() => vm.togglePlayPause()} aria-label={corriendo ? 'Pausar' : state.isAwaitingSessionStart ? 'Iniciar sesión' : 'Reanudar'} aria-keyshortcuts="Space">{corriendo ? '❚❚' : '▶'}</button>
              <button type="button" className="vp-redondo" onClick={() => vm.skipCurrentPhase()} aria-label="Saltar a la siguiente fase" title="Saltar fase (S)" aria-keyshortcuts="S">⏭</button>
            </div>
            <div className="vp-fila">
              <button type="button" className="vp-chip" onClick={() => vm.addMinutes(5)}>+ 5 min</button>
              {!descanso && (
                <button type="button" className="vp-chip" onClick={() => vm.toggleBlockCompletion(state.currentBlockIndex)} aria-pressed={!!bloque?.isCompleted} aria-keyshortcuts="N">
                  {bloque?.isCompleted ? 'Bloque hecho' : 'Marcar bloque'}
                </button>
              )}
              <button type="button" className="vp-chip" onClick={() => setZen(true)} aria-keyshortcuts="F">Modo enfoque</button>
            </div>
            <div className="vp-fila vp-cancelar">
              {confirma ? (
                <>
                  <span className="vp-suave">Si cancelas, esta sesión no se guardará.</span>
                  <button type="button" className="vp-chip vp-peligro" onClick={() => { setConfirma(false); vm.cancelSession(); }}>Sí, cancelar</button>
                  <button type="button" className="vp-chip" autoFocus onClick={() => setConfirma(false)}>Continuar estudiando</button>
                </>
              ) : (
                <>
                  <button type="button" className="vp-chip" onClick={() => vm.finishSessionPrompt()}>Finalizar y guardar</button>
                  <button type="button" className="vp-texto" onClick={() => setConfirma(true)}>Cancelar sesión</button>
                </>
              )}
            </div>
            <p className="vp-atajos" aria-hidden="true"><kbd>Espacio</kbd> pausar · <kbd>S</kbd> saltar · <kbd>R</kbd> reiniciar · <kbd>N</kbd> marcar · <kbd>F</kbd> enfoque</p>
          </div>

          <section className="vp-lista" aria-label="Progreso de bloques">
            <div className="vp-lista-cab"><h2>Bloques</h2><span>{hechos}/{total} hechos</span></div>
            <ol className={`vp-bloques${descanso ? ' vp-descanso' : ''}`}>
              {state.activeBlocks.map((b) => {
                const activo = b.index === state.currentBlockIndex;
                return (
                  <li key={b.index} className={`vp-bloque${b.isCompleted ? ' vp-hecho' : ''}${activo ? ' vp-activo' : ''}`}>
                    <button type="button" className="vp-marca" onClick={() => vm.toggleBlockCompletion(b.index)} aria-pressed={b.isCompleted} aria-label={`${b.isCompleted ? 'Desmarcar' : 'Marcar'} ${b.title}`}>{b.isCompleted ? '✓' : b.index}</button>
                    <div className="vp-bloque-texto">
                      <strong>{b.title}{activo ? <em> · actual</em> : null}</strong>
                      {b.goal !== `${state.activeConfig.topic}: ${state.activeConfig.subtopic}` ? <span>{b.goal}</span> : null}
                    </div>
                    <span className="vp-min">{state.activeConfig.workMinutes} min</span>
                  </li>
                );
              })}
            </ol>
            <p className="vp-pie">Duración total planificada: {duracion(minutosPlanificados(state))}</p>
          </section>
        </div>
      </div>
    </section>
  );
}
