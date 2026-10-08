import { useEffect, useReducer, useRef, useState } from 'react';
import { reducer, initialState, getProgress, buildSummary, duePauses } from './state.js';
import { loadState, saveState, clearSaved, workspaceExport, parseWorkspaceImport } from './storage.js';
import { downloadJson } from './download.js';
import Topbar from './components/Topbar.jsx';
import Desk from './components/Desk.jsx';
import Tray from './components/Tray.jsx';
import Tools from './components/Tools.jsx';
import SummaryDialog from './components/SummaryDialog.jsx';
import useStopwatch from './components/useStopwatch.js';

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      return loadState(window.localStorage) ?? init;
    } catch {
      return init; // almacenamiento bloqueado
    }
  });
  const [saveOk, setSaveOk] = useState(true);
  const stopwatch = useStopwatch();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsTab, setToolsTab] = useState('tasks');
  const [summary, setSummary] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const progress = getProgress(state.items);
  const session = state.phase === 'session';
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const start = () => {
    dispatch({ type: 'startSession' });
    stopwatch.reset();
    stopwatch.start();
    setFocusMode(false);
    // En pantallas anchas el menú se abre solo; en celular tapa el escritorio, así que no.
    setToolsOpen(window.matchMedia('(min-width: 761px)').matches);
    setToolsTab('tasks');
  };
  const finish = () => {
    stopwatch.pause();
    setSummary(buildSummary(state, stopwatch.elapsed));
  };
  const closeSummary = () => {
    setSummary(null);
    dispatch({ type: 'endSession' });
    stopwatch.reset();
  };

  // Guardado automático (con una pequeña espera para no escribir en cada letra).
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        setSaveOk(saveState(window.localStorage, state));
      } catch {
        setSaveOk(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [state.items, state.background, state.template, state.tasks, state.goals, state.distractions, state.nextId, state.nextListId]);

  const eraseSaved = () => {
    try {
      clearSaved(window.localStorage);
    } catch {
      /* sin acceso: no hay nada que borrar */
    }
    dispatch({ type: 'reset' });
  };
  // Devuelve un mensaje para mostrar en el menú «Datos».
  const importWorkspace = async (file) => {
    if (!file) return null;
    const res = parseWorkspaceImport(await file.text());
    if (!res.ok) return { ok: false, text: res.error };
    dispatch({ type: 'importWorkspace', workspace: res.workspace });
    return { ok: true, text: res.dropped > 0 ? `Importado (se descartaron ${res.dropped} elementos inválidos).` : 'Espacio importado.' };
  };
  const downloadWorkspace = () => {
    const out = workspaceExport(state);
    downloadJson(`espacio-de-trabajo-${out.exportedAt.slice(0, 10)}.json`, out);
  };

  // Atajo para abrir/cerrar el menú de herramientas.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('[aria-modal="true"]')) return; // con un diálogo abierto los atajos no actúan detrás
      if (e.key === 't' || e.key === 'T') setToolsOpen((o) => !o);
      if (e.key === 'p' || e.key === 'P') stopwatch.toggle();
      if ((e.key === 'f' || e.key === 'F') && sessionRef.current) setFocusMode((f) => !f);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const due = session ? duePauses(state.pauses, stopwatch.elapsed) : [];

  return (
    <div className={`app${toolsOpen ? ' tools-open' : ''}${session ? ' in-session' : ''}${session && focusMode ? ' focus' : ''}`}>
      <Topbar state={state} progress={progress} stopwatch={stopwatch} dispatch={dispatch} onStart={start} onFinish={finish} onDownload={downloadWorkspace} onImport={importWorkspace} onErase={eraseSaved} saveOk={saveOk} focusMode={focusMode} onFocusMode={() => setFocusMode((f) => !f)} />
      <main className="stage">
        <Desk state={state} phase={state.phase} dispatch={dispatch} duePauses={due} elapsed={stopwatch.elapsed} />
      </main>
      <Tools state={state} dispatch={dispatch} elapsed={stopwatch.elapsed} open={toolsOpen} setOpen={setToolsOpen} tab={toolsTab} setTab={setToolsTab} />
      <Tray dispatch={dispatch} count={state.items.length} />
      {summary && <SummaryDialog summary={summary} onClose={closeSummary} />}
    </div>
  );
}
