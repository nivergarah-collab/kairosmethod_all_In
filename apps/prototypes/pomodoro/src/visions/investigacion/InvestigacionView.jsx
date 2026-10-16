import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useVM, useEffectiveDark } from '../../useStore.jsx';
import { cargar, guardar, borrar } from './storage.js';
import { elegirPerfil } from './ajustes.js';
import { tokensPara } from './colores.js';
import {
  CLASE_FASE, NOMBRES_FASE, FOCUS, avisoPrevio, debeEsperar, duracion, estadoDe, etiquetaEstado, fasesDe, hhmm,
  horaDeTermino, indiceActual, mensajeCambio, minutosTotales, mmss, progreso, resumenDeSesion, textoAviso,
} from './model.js';
import { Ajustes } from './Ajustes.jsx';
import { useTemaVision } from '../tema/TemaVision.jsx';
import { Desplegable } from '../comun/Desplegable.jsx';
import { ListaBloques } from '../comun/ListaBloques.jsx';
import './investigacion.css';

const R = 90;
const CIRC = 2 * Math.PI * R;

function Anillo({ avance, clase, pausado, children }) {
  return (
    <div className={`vi-anillo vi-fase-${clase}${pausado ? ' vi-pausado' : ''}`}>
      <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <circle cx="100" cy="100" r={R} className="vi-pista" />
        <circle cx="100" cy="100" r={R} className="vi-avance" strokeDasharray={CIRC} strokeDashoffset={CIRC * avance} transform="rotate(-90 100 100)" />
      </svg>
      <div className="vi-anillo-centro">{children}</div>
    </div>
  );
}

const sistemaPideContraste = () => {
  try { return !!window.matchMedia?.('(prefers-contrast: more)').matches; } catch { return false; }
};

/**
 * Visión Investigación: capa de presentación sobre el contrato de sesión. Anillo de progreso, avisos antes
 * de cada cambio, avance de fases con o sin confirmación, secuencia completa y ajustes propios con tres perfiles.
 * Los tiempos, el sonido y la vibración son los comunes de la app (Configurar); aquí solo se ajusta la pantalla.
 */
export function InvestigacionView() {
  const { state, vm } = useVM();
  const oscuro = useEffectiveDark();
  const tema = useTemaVision('investigacion');
  const [cfg, setCfg] = useState(() => cargar());
  const [vista, setVista] = useState('sesion');
  const [esperando, setEsperando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [confirmaFin, setConfirmaFin] = useState(false);
  const [pasos, setPasos] = useState([]);
  const [nuevoPaso, setNuevoPaso] = useState('');
  const prev = useRef({ phase: state.currentPhase, block: state.currentBlockIndex });
  const saltando = useRef(false);
  const idPaso = useRef(0);

  useEffect(() => { guardar(cfg); }, [cfg]);

  // Cambio de fase: mensaje y, según el modo de avance, espera la confirmación (pausa el contrato en ese punto).
  useEffect(() => {
    const p = prev.current;
    prev.current = { phase: state.currentPhase, block: state.currentBlockIndex };
    if (!state.isSessionActive) { setEsperando(false); setMensaje(''); saltando.current = false; return; }
    if (p.phase === state.currentPhase && p.block === state.currentBlockIndex) return;
    const saltada = saltando.current;
    saltando.current = false;
    const espera = debeEsperar(cfg.avance, state.currentPhase);
    setMensaje(mensajeCambio({ terminada: p.phase, siguiente: state.currentPhase, espera, saltada }));
    setConfirmaFin(false);
    if (espera && !state.showSummaryDialog) { vm.pauseTimer(); setEsperando(true); }
  }, [state.currentPhase, state.currentBlockIndex, state.isSessionActive, state.showSummaryDialog, cfg.avance, vm]);

  const primario = () => {
    setConfirmaFin(false);
    if (esperando) { setEsperando(false); setMensaje(''); vm.resumeTimer(); } else vm.togglePlayPause();
  };
  const mas = () => { setConfirmaFin(false); vm.addMinutes(cfg.extension); };
  const saltar = () => { setConfirmaFin(false); saltando.current = true; vm.skipCurrentPhase(); };
  const terminar = () => {
    if (!confirmaFin) { setConfirmaFin(true); return; }
    setConfirmaFin(false);
    vm.finishSessionPrompt();
  };

  // «Terminar» pide un segundo toque seguido: cualquier otra cosa lo cancela.
  useEffect(() => {
    if (!confirmaFin) return undefined;
    const cancelar = (e) => { if (!(e.target?.closest && e.target.closest('[data-terminar]'))) setConfirmaFin(false); };
    const tecla = (e) => { if (e.key === 'Escape') setConfirmaFin(false); };
    document.addEventListener('pointerdown', cancelar, true);
    document.addEventListener('focusin', cancelar, true);
    document.addEventListener('keydown', tecla, true);
    return () => {
      document.removeEventListener('pointerdown', cancelar, true);
      document.removeEventListener('focusin', cancelar, true);
      document.removeEventListener('keydown', tecla, true);
    };
  }, [confirmaFin]);

  // Foco: al abrir Ajustes va al título; al volver, al botón que los abrió.
  const vistaPrevia = useRef(vista);
  useEffect(() => {
    if (vistaPrevia.current === vista) return;
    vistaPrevia.current = vista;
    document.getElementById(vista === 'ajustes' ? 'vi-t-ajustes' : 'vi-btn-ajustes')?.focus();
  }, [vista]);

  // Atajos: Espacio, M, S y Esc. No actúan en campos de texto, sobre un botón con Espacio ni con un diálogo abierto.
  useEffect(() => {
    const f = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (tag === 'BUTTON' && e.key === ' ')) { if (e.key === 'Escape' && vista === 'ajustes') setVista('sesion'); return; }
      if (document.querySelector('[role="dialog"]') || state.isReviewing) return;
      if (e.key === 'Escape' && vista === 'ajustes') setVista('sesion');
      else if (vista === 'sesion' && state.isSessionActive && e.key === ' ') { e.preventDefault(); primario(); }
      else if (vista === 'sesion' && state.isSessionActive && (e.key === 'm' || e.key === 'M')) mas();
      else if (vista === 'sesion' && state.isSessionActive && (e.key === 's' || e.key === 'S')) saltar();
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });

  const vars = useMemo(() => {
    const t = tokensPara({ oscuro, altoContraste: state.isDarkTheme === null && sistemaPideContraste() });
    return { ...Object.fromEntries(Object.entries(t).map(([k, v]) => [`--vi-${k}`, v])), ...tema.vars };
  }, [oscuro, state.isDarkTheme, tema.vars]);
  const raiz = { style: vars, 'data-tamano': cfg.tamano, 'data-mov': cfg.movimiento, 'data-testid': 'vision_investigacion' };

  if (!state.isSessionActive) {
    return (
      <section className="vi" aria-label="Visión Investigación" {...raiz}>
        <div className="vi-pantalla">
          <h1>No hay una sesión en curso</h1>
          <p className="vi-nota">Vuelve a Configurar para preparar tus bloques de estudio.</p>
        </div>
      </section>
    );
  }

  const fases = fasesDe(state);
  const iActual = indiceActual(state);
  const fase = fases[iActual] ?? fases[fases.length - 1];
  const estado = estadoDe(state, esperando);
  const clase = CLASE_FASE[state.currentPhase];
  const nombre = NOMBRES_FASE[state.currentPhase];
  const totalBloques = state.activeBlocks.length;
  const ultimo = state.currentPhase === FOCUS && state.currentBlockIndex === totalBloques;
  const segAviso = avisoPrevio(state, cfg.avisoSeg);
  const aviso = segAviso !== null && !esperando ? textoAviso(state, fases, segAviso) : '';
  const ahora = Date.now();
  const termino = horaDeTermino(state, fases, ahora);
  const bloque = state.activeBlocks[state.currentBlockIndex - 1];
  // En un descanso se muestra lo que sigue; en el último descanso (si lo hay) queda el bloque recién hecho.
  const enDescanso = state.currentPhase !== FOCUS;
  const bloqueMostrado = enDescanso ? (state.activeBlocks[state.currentBlockIndex] ?? bloque) : bloque;
  const hechos = state.activeBlocks.filter((b) => b.isCompleted).length;
  const etiquetaPrimario = state.isAwaitingSessionStart ? 'Iniciar sesión' : esperando ? `Empezar ${nombre.toLowerCase()}` : state.isTimerRunning ? 'Pausar' : 'Continuar';
  const minutosQuedan = Math.ceil(state.secondsRemaining / 60);

  if (vista === 'ajustes') {
    return (
      <section className="vi" aria-label="Visión Investigación" {...raiz}>
        <Ajustes
          resumen={resumenDeSesion(state, esperando, aviso || mensaje)}
          cfg={cfg}
          tema={state.isDarkTheme === null ? 'sistema' : state.isDarkTheme ? 'oscuro' : 'claro'}
          onTema={(t) => vm.setDarkTheme(t === 'sistema' ? null : t === 'oscuro')}
          onCambio={setCfg}
          onRestablecer={() => { borrar(); setCfg(elegirPerfil('libre')); }}
          onVolver={() => setVista('sesion')}
        />
      </section>
    );
  }

  const agregarPaso = (e) => {
    e.preventDefault();
    const t = nuevoPaso.trim();
    if (!t) return;
    idPaso.current += 1;
    setPasos((p) => [...p, { id: idPaso.current, texto: t.slice(0, 80), hecho: false }]);
    setNuevoPaso('');
    setMensaje(`Paso añadido: ${t.slice(0, 80)}`);
  };

  return (
    <section className="vi" aria-label="Visión Investigación" {...raiz}>
      <div className="vi-pantalla">
        {tema.panel}
        <div className="vi-barra">
          <h1 id="vi-t">Pomodoro</h1>
          <button type="button" id="vi-btn-ajustes" className="vi-btn" onClick={() => { setConfirmaFin(false); setVista('ajustes'); }}>Ajustes</button>
        </div>

        <div className="vi-grid">
          <div className="vi-col">
            <section className={`vi-tarjeta vi-fase-${clase}`} aria-label="Sesión">
              <p className="vi-fase-nombre">
                <span className="vi-fase-etiqueta">{nombre}</span>{' '}
                <span className="vi-fase-bloque">· Bloque {fase.bloque} de {totalBloques}{ultimo ? ' (último, sin descanso después)' : ''}</span>
              </p>
              <Anillo avance={progreso(state)} clase={clase} pausado={estado === 'pausado'}>
                {cfg.cifras && <span className="vi-digitos" aria-hidden="true">{mmss(state.secondsRemaining)}</span>}
                <span className="vi-estado-texto">{estado === 'pausado' && <span className="vi-icono-pausa" aria-hidden="true">❚❚ </span>}{etiquetaEstado(estado)}</span>
              </Anillo>
              <p className="vi-solo-lector">{`Quedan unos ${minutosQuedan} minutos de ${nombre.toLowerCase()}.`}</p>
              {bloqueMostrado && <p className="vi-meta"><span className="vi-meta-pre">{enDescanso && bloqueMostrado !== bloque ? 'Sigue' : 'Ahora'}: </span>{bloqueMostrado.goal}</p>}

              <div className="vi-acciones">
                <button type="button" id="vi-btn-principal" className="vi-btn vi-btn-principal" onClick={primario}>{etiquetaPrimario}</button>
              </div>
              <div className="vi-acciones vi-secundarias">
                <button type="button" className="vi-btn" onClick={mas}>+ {cfg.extension} min</button>
                <button type="button" className="vi-btn" onClick={saltar}>Saltar fase</button>
                <button type="button" className="vi-btn" data-terminar="1" onClick={terminar}>{confirmaFin ? 'Confirmar: terminar' : 'Terminar'}</button>
              </div>
            </section>

            <div className="vi-estado-vivo" role="status" aria-live="polite">
              {confirmaFin && <p className="vi-aviso">Para terminar la sesión, pulsa «Confirmar: terminar». Esc o tocar otra cosa lo cancela.</p>}
              {aviso && !confirmaFin && <p className="vi-aviso">{aviso}</p>}
              {mensaje && !aviso && !confirmaFin && <p className="vi-mensaje">{mensaje}</p>}
            </div>
          </div>

          <div className="vi-col">
            <section className="vi-tarjeta" aria-label="Bloques de la sesión">
              <Desplegable titulo="Bloques" resumen={`${hechos} de ${totalBloques} hechos`} abiertoInicial testId="inv_bloques">
                <ListaBloques blocks={state.activeBlocks} currentBlockIndex={state.currentBlockIndex} currentPhase={state.currentPhase} onToggle={(i) => vm.toggleBlockCompletion(i)} />
              </Desplegable>
            </section>

            <section className="vi-tarjeta" aria-label="Pasos del bloque">
              <Desplegable titulo="Pasos (opcional)" resumen={pasos.length === 0 ? 'Divide el bloque en pasitos si te ayuda' : `${pasos.filter((p) => p.hecho).length} de ${pasos.length} hechos`} testId="inv_pasos">
              {pasos.length > 0 && (
                <ul className="vi-pasos" aria-label="Pasos">
                  {pasos.map((p) => (
                    <li key={p.id}>
                      <label className={p.hecho ? 'vi-hecho' : ''}>
                        <input type="checkbox" checked={p.hecho} onChange={() => setPasos((a) => a.map((x) => (x.id === p.id ? { ...x, hecho: !x.hecho } : x)))} />
                        <span>{p.texto}</span>
                      </label>
                      <button type="button" className="vi-btn vi-btn-quitar" aria-label={`Quitar paso: ${p.texto}`} onClick={() => { setPasos((a) => a.filter((x) => x.id !== p.id)); setMensaje(`Paso quitado: ${p.texto}`); document.getElementById('vi-nuevo-paso')?.focus(); }}>Quitar</button>
                    </li>
                  ))}
                </ul>
              )}
              <form className="vi-nuevo-paso" onSubmit={agregarPaso}>
                <label className="vi-solo-lector" htmlFor="vi-nuevo-paso">Nuevo paso</label>
                <input id="vi-nuevo-paso" type="text" maxLength={80} value={nuevoPaso} onChange={(e) => setNuevoPaso(e.target.value)} autoComplete="off" placeholder="Un paso" />
                <button type="submit" className="vi-btn">Añadir</button>
              </form>
              </Desplegable>
            </section>

            {cfg.secuencia ? (
              <section className="vi-tarjeta" aria-labelledby="vi-t-sec">
                <h2 id="vi-t-sec">Secuencia</h2>
                <ol className="vi-secuencia">
                  {fases.map((f, i) => (
                    <li key={i} className={i === iActual ? 'vi-actual' : i < iActual ? 'vi-hecha' : ''} aria-current={i === iActual ? 'step' : undefined}>
                      <span>{NOMBRES_FASE[f.tipo]}</span>
                      <span>{f.min} min{i < iActual ? ' · hecha' : i === iActual ? ' · ahora' : ''}</span>
                    </li>
                  ))}
                </ol>
                <p className="vi-resumen-seq">Total {duracion(minutosTotales(fases))}. Termina hacia las {hhmm(termino)}{cfg.avance !== 'auto' ? ' (más si esperas entre fases)' : ''}.</p>
              </section>
            ) : (
              <p className="vi-compacto">Sesión de {totalBloques} bloques · {duracion(minutosTotales(fases))} en total</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
