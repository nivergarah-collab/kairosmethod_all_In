import React, { useEffect, useRef, useState } from 'react';
import { useVM } from '../../useStore.jsx';
import { buildTimeline, cameFromBreak, estimatedEndMs, formatClock, formatDuration, plannedStudyMinutes, quedan } from './model.js';
import { useTemaVision } from '../tema/TemaVision.jsx';
import { Desplegable } from '../comun/Desplegable.jsx';
import { ListaBloques } from '../comun/ListaBloques.jsx';
import './calma.css';

function Timeline({ items, label }) {
  return (
    <div className="vc-linea" role="img" aria-label={label}>
      {items.map((it, i) => (
        <div key={i} className={`vc-tramo vc-${it.kind}${it.current ? ' vc-actual' : ''}`} style={{ flexGrow: it.minutes, flexBasis: 0 }}>
          <span className="vc-relleno" style={{ transform: `scaleX(${it.fill})` }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Visión Calma: capa de presentación sobre el contrato de sesión. Un módulo a la vez, tiempo en minutos,
 * la línea de la tarde y, al terminar un descanso, espera un «Estoy listo» (pausa el contrato en ese punto).
 */
export function CalmaView() {
  const { state, vm } = useVM();
  const tema = useTemaVision('calma');
  const [waiting, setWaiting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const prevPhase = useRef(state.currentPhase);
  const skipping = useRef(false);

  useEffect(() => {
    if (cameFromBreak(prevPhase.current, state.currentPhase) && state.isSessionActive && !state.showSummaryDialog) {
      if (skipping.current) skipping.current = false;
      else {
        vm.pauseTimer();
        setWaiting(true);
      }
    }
    prevPhase.current = state.currentPhase;
  }, [state.currentPhase, state.isSessionActive, state.showSummaryDialog, vm]);

  if (!state.isSessionActive) {
    return (
      <section className="vc vc-pantalla" style={tema.vars} aria-label="Visión Calma">
        <div className="vc-barra">{tema.panel}</div>
        <div className="vc-cuerpo">
          <h1>No hay una sesión en curso</h1>
          <p className="vc-suave">Vuelve a Configurar para planear tu tarde.</p>
        </div>
      </section>
    );
  }

  const items = buildTimeline(state);
  const total = state.activeBlocks.length;
  const isBreak = state.currentPhase !== 'FOCUS';
  const paused = !state.isTimerRunning;
  const awaitingStart = state.isAwaitingSessionStart;
  const block = state.activeBlocks[state.currentBlockIndex - 1];
  const nextSeg = items[items.findIndex((i) => i.current) + 1];
  const after = !nextSeg ? 'Es el último módulo.' : nextSeg.kind === 'break' ? `Después: descanso de ${nextSeg.minutes} min.` : `Después: ${state.activeBlocks[nextSeg.blockIndex - 1]?.goal ?? 'el siguiente módulo'}.`;
  const nowMs = Date.now();
  const endMs = estimatedEndMs(state, nowMs);

  const startNext = () => {
    setWaiting(false);
    vm.resumeTimer();
  };
  const skip = () => {
    skipping.current = isBreak; // solo al saltar un descanso se evita la espera de «Estoy listo»
    vm.skipCurrentPhase();
  };
  // Qué hace «Saltar» según dónde estés: en un módulo salta al descanso (o al siguiente módulo, o termina si es el último).
  const skipLabel = isBreak ? 'Saltar el descanso' : !nextSeg ? 'Terminar este módulo' : nextSeg.kind === 'break' ? 'Saltar al descanso' : 'Saltar al siguiente módulo';
  const hechos = state.activeBlocks.filter((b) => b.isCompleted).length;

  return (
    <section className={`vc vc-pantalla vc-sesion${isBreak ? ' vc-en-descanso' : ''}`} aria-label="Visión Calma" data-testid="vision_calma" style={tema.vars}>
      <div className="vc-barra">{tema.panel}</div>
      <div className="vc-cuerpo">
      {waiting ? (
        <>
          <p className="vc-suave">Descanso terminado</p>
          <h1>Cuando estés listo, seguimos con {block?.goal ?? 'el siguiente módulo'}.</h1>
          <div className="vc-acciones"><button type="button" className="vc-principal" onClick={startNext}>Estoy listo</button></div>
        </>
      ) : isBreak ? (
        <>
          <p className="vc-suave">Módulo hecho. Tómate este rato.</p>
          <h1>Descanso</h1>
          <p className="vc-tiempo">{awaitingStart ? 'Lista para empezar. ' : paused ? 'En pausa. ' : ''}Quedan {quedan(state.secondsRemaining)}</p>
        </>
      ) : (
        <>
          <p className="vc-suave">Módulo {state.currentBlockIndex} de {total}</p>
          <h1 className="vc-tema">{block?.goal}</h1>
          <p className="vc-tiempo">{awaitingStart ? 'Lista para empezar. ' : paused ? 'En pausa. ' : ''}Quedan {quedan(state.secondsRemaining)}</p>
        </>
      )}

      <div className="vc-resumen">
        <Timeline items={items} label={`Avance de la sesión: módulo ${state.currentBlockIndex} de ${total}`} />
        {!waiting && <p className="vc-suave">{after}</p>}
      </div>

      {!waiting && (
        <div className="vc-acciones">
          <button type="button" className="vc-secundario" onClick={skip}>{skipLabel}</button>
          {paused ? (
            <button type="button" className="vc-principal" onClick={() => vm.resumeTimer()}>{awaitingStart ? 'Iniciar sesión' : 'Seguir'}</button>
          ) : (
            <button type="button" className="vc-secundario" onClick={() => vm.pauseTimer()}>Pausar</button>
          )}
        </div>
      )}

      <div className="vc-modulos">
        <Desplegable titulo="Todos los módulos" resumen={`${hechos} de ${total} hechos`} testId="calma_modulos">
          <ListaBloques blocks={state.activeBlocks} currentBlockIndex={state.currentBlockIndex} currentPhase={state.currentPhase} onToggle={(i) => vm.toggleBlockCompletion(i)} etiquetaBloque="Módulo" />
        </Desplegable>
      </div>

      <div className="vc-terminar">
        {confirming ? (
          <p>
            ¿Terminar ahora? Se guarda lo que llevas.{' '}
            <button type="button" className="vc-texto" onClick={() => vm.finishSessionPrompt()}>Sí, terminar</button>{' '}
            <button type="button" className="vc-texto" onClick={() => setConfirming(false)}>Seguir</button>
          </p>
        ) : (
          <button type="button" className="vc-texto" onClick={() => setConfirming(true)}>Terminar la sesión</button>
        )}
      </div>
      <p className="vc-hora vc-suave">
        Son las {formatClock(nowMs)}; terminarías hacia las {formatClock(endMs)}. {formatDuration(plannedStudyMinutes(state))} de estudio planeados.
      </p>
      </div>
    </section>
  );
}
