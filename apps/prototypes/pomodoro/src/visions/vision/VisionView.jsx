import React, { useState } from 'react';
import { useVM } from '../../useStore.jsx';
import { AlertDialog, TextButton } from '../../m3.jsx';
import { cardStates, fmt, goalOf } from './model.js';
import './vision.css';
import { useTemaVision } from '../tema/TemaVision.jsx';

const PHASE_NAME = { FOCUS: 'Enfoque', SHORT_BREAK: 'Descanso corto', LONG_BREAK: 'Descanso largo' };

function Strip({ cards }) {
  return (
    <div className="vv-strip" role="list" aria-label="Bloques de la sesión">
      {cards.map((c) => (c.kind === 'open' ? (
        <div key={c.index} role="listitem" className="vv-card vv-slot" aria-label={`Bloque ${c.index}, el abierto arriba`}>{`${c.index} · aquí`}</div>
      ) : (
        <div key={c.index} role="listitem" className={`vv-card${c.done ? ' done' : ''}`} aria-label={`Bloque ${c.index}: ${c.goal}${c.done ? ', hecho' : ''}`}>
          <span className="n">{c.index}</span>
          {c.done && <span className="ok" aria-hidden="true">✓</span>}
          <span className="t">{c.goal}</span>
        </div>
      )))}
    </div>
  );
}

/**
 * Visión «Visión»: capa de presentación sobre el contrato. Enfoque: la hora grande y la ficha del bloque
 * actual abierta; descanso: el mapa de ruta de fichas es lo principal y el reloj queda en una cápsula.
 */
export function VisionView() {
  const { state, vm } = useVM();
  const tema = useTemaVision('vision');
  const [picked, setPicked] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { isSessionActive, isTimerRunning, isAwaitingSessionStart, currentPhase, secondsRemaining, currentBlockIndex, activeBlocks } = state;

  if (!isSessionActive) {
    return (
      <section className="vv vv-wrap vv-idle" style={tema.vars} aria-label="Visión de producto">
        <h2>No hay sesión en curso</h2>
        <p>Prepara tus bloques en Configurar y comienza cuando estés listo.</p>
        <button type="button" className="vv-btn main" onClick={() => vm.setTab(0)}>Configurar sesión</button>
      </section>
    );
  }

  const isFocus = currentPhase === 'FOCUS';
  const cards = cardStates(activeBlocks, currentBlockIndex, currentPhase);
  const current = activeBlocks.find((b) => b.index === currentBlockIndex);
  const pickedBlock = activeBlocks.find((b) => b.index === picked);
  const toggle = (
    <button type="button" className={isFocus ? 'vv-btn main' : 'vv-btn small'} onClick={() => vm.togglePlayPause()}>{isTimerRunning ? 'Pausar' : isAwaitingSessionStart ? 'Iniciar sesión' : 'Reanudar'}</button>
  );

  return (
    <section className="vv vv-wrap" data-phase={currentPhase} aria-label="Visión de producto" data-testid="vision_vision" style={tema.vars}>
      {tema.panel}
      {isFocus ? (
        <>
          <header className="vv-head">
            <div>
              <div className="vv-tag">{PHASE_NAME[currentPhase]}</div>
              <div className="vv-time" role="timer" aria-label={`${fmt(secondsRemaining)} restantes`}>{fmt(secondsRemaining)}</div>
            </div>
            <div className="vv-actions">
              <button type="button" className="vv-btn" onClick={() => vm.restartPhase()}>Reiniciar</button>
              {toggle}
              <button type="button" className="vv-btn" onClick={() => vm.skipCurrentPhase()}>Saltar</button>
            </div>
          </header>
          {current && (
            <article className="vv-open" aria-label={`Bloque ${current.index} abierto`}>
              <h2>{goalOf(current)}</h2>
              <div className="vv-grow" />
              <div className="vv-foot">
                <button type="button" className="vv-link" aria-pressed={current.isCompleted} onClick={() => vm.toggleBlockCompletion(current.index)}>
                  {current.isCompleted ? 'Hecho ✓ · deshacer' : 'Marcar hecho'}
                </button>
              </div>
            </article>
          )}
          <Strip cards={cards} />
        </>
      ) : (
        <>
          <header className="vv-head vv-head-break">
            <div className="vv-tag">{PHASE_NAME[currentPhase]}</div>
            <div className="vv-capsule">
              <span className="vv-capsule-time" role="timer" aria-label={`${fmt(secondsRemaining)} de descanso`}>{fmt(secondsRemaining)}</span>
              {toggle}
              <button type="button" className="vv-btn small" onClick={() => vm.skipCurrentPhase()}>Saltar</button>
            </div>
          </header>
          <div className="vv-grid" role="group" aria-label="Mapa de ruta">
            {cards.map((c) => (
              <button
                key={c.index}
                type="button"
                aria-pressed={picked === c.index}
                className={`vv-card${c.done ? ' done' : ''}${c.kind === 'next' ? ' next' : ''}`}
                onClick={() => setPicked(picked === c.index ? null : c.index)}
              >
                <span className="n">{c.index}</span>
                {c.done && <span className="ok" aria-hidden="true">✓</span>}
                <span className="t">{c.goal}</span>
              </button>
            ))}
          </div>
          {pickedBlock && (
            <article className="vv-open" aria-label={`Bloque ${pickedBlock.index}`}>
              <h2>{goalOf(pickedBlock)}</h2>
            </article>
          )}
        </>
      )}

      <div className="vv-foot-links">
        <button type="button" className="vv-link" onClick={() => vm.finishSessionPrompt()}>Finalizar y guardar</button>
        <button type="button" className="vv-link danger" onClick={() => setConfirmCancel(true)}>Cancelar sesión</button>
      </div>

      {confirmCancel && (
        <AlertDialog
          onDismiss={() => setConfirmCancel(false)}
          title="¿Cancelar sesión actual?"
          text="Si cancelas ahora, no se guardarán las estadísticas de esta sesión en tu registro."
          confirmButton={<TextButton onClick={() => { setConfirmCancel(false); vm.cancelSession(); }}><span style={{ color: 'var(--error)' }}>Sí, cancelar</span></TextButton>}
          dismissButton={<TextButton onClick={() => setConfirmCancel(false)}>Continuar estudiando</TextButton>}
        />
      )}
    </section>
  );
}
