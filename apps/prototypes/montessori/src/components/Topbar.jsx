import { useEffect, useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog.jsx';
import { BACKGROUNDS, TEMPLATES, formatClock } from '../state.js';
import { EXAMPLES, exampleWorkspace, exampleGlyphs } from '../examples.js';

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      <span className="seg-label">{label}</span>
      <div className="seg-opts">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={value === o.id ? 'on' : ''}
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Topbar({ state, progress, stopwatch, dispatch, onStart, onFinish, onDownload, onImport, onErase, saveOk, focusMode, onFocusMode }) {
  const [dataOpen, setDataOpen] = useState(false);
  const [confirmErase, setConfirmErase] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const session = state.phase === 'session';
  const [clockHidden, setClockHidden] = useState(false);
  const empty = state.items.length === 0;
  // «Cargar ejemplo» y «Vaciar» reemplazan el escritorio: con elementos puestos piden confirmación.
  const [pending, setPending] = useState(null);
  const [exOpen, setExOpen] = useState(false);
  const [exNotice, setExNotice] = useState('');
  const exRef = useRef(null);
  const exBtn = useRef(null);
  // Teclado en el menú de ejemplos: flechas mueven entre opciones, Escape cierra y devuelve el foco.
  const onExKey = (e) => {
    if (e.key === 'Escape') { setExOpen(false); exBtn.current?.focus(); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const opts = [...exRef.current.querySelectorAll('.example-opt')];
    const i = opts.indexOf(document.activeElement);
    e.preventDefault();
    opts[(i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length]?.focus();
  };
  // El menú de ejemplos se cierra al tocar fuera de él.
  useEffect(() => {
    if (!exOpen) return undefined;
    const onDown = (e) => { if (!exRef.current?.contains(e.target)) setExOpen(false); };
    exRef.current?.querySelector('.example-opt')?.focus();
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [exOpen]);
  const applyExample = (id) => {
    const payload = exampleWorkspace(id, state.nextId);
    if (!payload) return;
    dispatch({ type: 'applyExample', payload });
    setExNotice(`Ejemplo cargado: ${EXAMPLES.find((e) => e.id === id).name}`);
  };
  const pickExample = (id) => {
    setExOpen(false);
    if (empty) applyExample(id);
    else setPending(id);
  };
  const ask = (kind) => {
    setDataOpen(false);
    setPending(kind);
  };
  const pendingExample = EXAMPLES.find((e) => e.id === pending);
  const CONFIRM = {
    clear: { title: 'Vaciar el escritorio', text: 'Se quitan todos los elementos del escritorio. Puedes volver a agregarlos desde la bandeja.', label: 'Vaciar' },
  };

  return (
    <header className={`topbar${session ? ' in-session' : ''}`}>
      {!session && (
      <div className="brand">
        <h1>Prepara tu espacio</h1>
        <p data-testid="progress-text" aria-live="polite">
          {progress.total === 0
            ? 'Agrega elementos para empezar'
            : progress.ready
              ? '✅ Espacio preparado'
              : `${progress.done} de ${progress.total} listos`}
        </p>
        <div className="meter" role="progressbar" aria-label="Avance de la preparación" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}>
          <span style={{ width: `${progress.percent}%` }} />
        </div>
      </div>
      )}

      <div className={`clock${clockHidden ? ' hidden' : ''}`}>
        {clockHidden ? (
          <button type="button" className="btn ghost" onClick={() => setClockHidden(false)}>
            Mostrar cronómetro
          </button>
        ) : (
          <>
            <output className="clock-digits" aria-live="off" aria-label="Tiempo total de la sesión" data-testid="stopwatch">
              {formatClock(stopwatch.elapsed)}
            </output>
            <div className="clock-btns">
              <button type="button" className="btn primary" title="Atajo: P" aria-keyshortcuts="P" onClick={stopwatch.toggle}>
                {stopwatch.running ? 'Pausar' : stopwatch.elapsed > 0 ? 'Seguir' : 'Iniciar'}
              </button>
              <button type="button" className="btn ghost" aria-label="Reiniciar cronómetro" onClick={stopwatch.reset} disabled={stopwatch.elapsed === 0}>
                <span className="txt">Reiniciar</span>
                <span className="ico" aria-hidden="true">↺</span>
              </button>
              <button type="button" className="btn ghost" aria-label="Ocultar cronómetro" onClick={() => setClockHidden(true)}>
                Ocultar
              </button>
            </div>
            <span className="clock-note">Se recomienda mantenerlo visible</span>
          </>
        )}
      </div>

      {session ? (
        <div className="controls session-controls">
          <button type="button" className={`btn ghost subtle${focusMode ? ' on' : ''}`} aria-pressed={focusMode} aria-keyshortcuts="F" title="Atenúa los elementos secundarios (atajo: F)" onClick={onFocusMode}>
            Modo enfoque
          </button>
          <button type="button" className="btn ghost subtle" onClick={onFinish}>
            Terminar sesión
          </button>
        </div>
      ) : (
      <div className="controls">
 <div className="mobile-selects">
          <label>
            <span className="sr-only">Fondo</span>
            <select value={state.background} onChange={(e) => dispatch({ type: 'setBackground', background: e.target.value })}>
              {BACKGROUNDS.map((b) => (
                <option key={b.id} value={b.id}>
                  Fondo: {b.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Aspecto</span>
            <select value={state.template} onChange={(e) => dispatch({ type: 'setTemplate', template: e.target.value })}>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Segmented label="Fondo" options={BACKGROUNDS} value={state.background} onChange={(background) => dispatch({ type: 'setBackground', background })} />
        <Segmented label="Aspecto" options={TEMPLATES} value={state.template} onChange={(template) => dispatch({ type: 'setTemplate', template })} />
        <div className="actions">
          <div className="menu examples" ref={exRef}>
            <button type="button" className="btn ghost" aria-expanded={exOpen} aria-haspopup="true" aria-controls="examples-pop" ref={exBtn} onClick={() => { setExOpen(!exOpen); setDataOpen(false); }}>
              Ejemplos ▾
            </button>
            {exOpen && (
              <div id="examples-pop" className="menu-pop examples-pop" role="group" aria-label="Ejemplos de escritorio" onKeyDown={onExKey}>
                <p className="menu-note">Escenas listas para probar. {empty ? '' : 'Reemplazan tu escritorio actual (te lo preguntamos antes).'}</p>
                {EXAMPLES.map((ex) => (
                  <button key={ex.id} type="button" className="example-opt" onClick={() => pickExample(ex.id)}>
                    <span className={`ex-glyphs bg-${ex.background} tpl-${ex.template}`} aria-hidden="true" title={`${BACKGROUNDS.find((b) => b.id === ex.background).label} · ${TEMPLATES.find((t) => t.id === ex.template).label}`}>{exampleGlyphs(ex)}</span>
                    <span className="ex-name">{ex.name}</span>
                    <span className="ex-desc">{ex.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="btn ghost wide-only" disabled={empty} onClick={() => ask('clear')}>
            Vaciar
          </button>
          <div className="menu">
            <button type="button" className="btn ghost" aria-expanded={dataOpen} aria-haspopup="true" onClick={() => { setDataOpen(!dataOpen); setConfirmErase(false); setExOpen(false); }}>
              Datos ▾
            </button>
            {dataOpen && (
              <div className="menu-pop" role="group" aria-label="Datos">
                <p className={saveOk ? 'menu-note' : 'menu-note warn'} role="status">
                  {saveOk ? 'Se guarda solo en este navegador.' : 'No se pudo guardar: el navegador bloquea el almacenamiento.'}
                </p>
                <button type="button" className="narrow-only" disabled={empty} onClick={() => ask('clear')}>
                  Vaciar escritorio
                </button>
                <button type="button" onClick={() => { onDownload(); setDataOpen(false); }}>
                  Descargar espacio (JSON)
                </button>
                <label className="menu-file">
                  Importar espacio (JSON)
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      setImportMsg(await onImport(f));
                    }}
                  />
                </label>
                {importMsg && (
                  <p className={importMsg.ok ? 'menu-note' : 'menu-note warn'} role="status">
                    {importMsg.text}
                  </p>
                )}
                <details className="menu-help">
                  <summary>Atajos de teclado</summary>
                  <dl>
                    <dt><kbd>P</kbd></dt><dd>Iniciar o pausar el cronómetro</dd>
                    <dt><kbd>T</kbd></dt><dd>Abrir o cerrar las herramientas</dd>
                    <dt><kbd>F</kbd></dt><dd>Modo enfoque (solo en sesión)</dd>
                    <dt><kbd>Tab</kbd></dt><dd>Moverse entre elementos</dd>
                    <dt><kbd>←↑↓→</kbd></dt><dd>Mover el elemento enfocado (Mayús: más)</dd>
                    <dt><kbd>V</kbd> <kbd>S</kbd></dt><dd>Cambiar vista · cambiar tamaño</dd>
                    <dt><kbd>Enter</kbd></dt><dd>Configurar el elemento</dd>
                    <dt><kbd>Supr</kbd></dt><dd>Quitar el elemento</dd>
                  </dl>
                </details>
                {confirmErase ? (
                  <div className="menu-confirm">
                    <span>¿Borrar todo lo guardado?</span>
                    <button type="button" className="danger" onClick={() => { onErase(); setConfirmErase(false); setDataOpen(false); }}>
                      Sí, borrar
                    </button>
                    <button type="button" onClick={() => setConfirmErase(false)}>
                      No
                    </button>
                  </div>
                ) : (
                  <button type="button" className="danger" onClick={() => setConfirmErase(true)}>
                    Borrar datos guardados
                  </button>
                )}
              </div>
            )}
          </div>
          <button type="button" className="btn primary start" aria-label="Iniciar sesión de estudio" onClick={onStart}>
            Iniciar sesión<span className="long-only"> de estudio</span>
          </button>
        </div>
      </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">{exNotice}</p>
      {pending && (
        <ConfirmDialog
          title={pendingExample ? `Cargar «${pendingExample.name}»` : CONFIRM[pending].title}
          text={pendingExample
            ? 'Este ejemplo reemplaza lo que hay ahora en tu escritorio. Tus tareas y metas actuales se conservan (si no tienes, se agregan las del ejemplo).'
            : CONFIRM[pending].text}
          confirmLabel={pendingExample ? 'Cargar ejemplo' : CONFIRM[pending].label}
          onCancel={() => setPending(null)}
          onConfirm={() => { if (pendingExample) applyExample(pending); else dispatch({ type: pending }); setPending(null); }}
        />
      )}
    </header>
  );
}
