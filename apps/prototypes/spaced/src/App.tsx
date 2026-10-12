import { useEffect, useMemo, useRef, useState } from 'react';
import type { Quality } from './types';
import { DemoScope, StoreProvider, useStore } from './state/StoreContext';
import { dueCards, goalDone, phaseCounts } from './state/selectors';
import { playSound } from './lib/sound';
import { todayKey } from './lib/dates';
import { Topbar } from './components/Topbar';
import { TodayStrip } from './components/TodayStrip';
import { Ribbons } from './components/Ribbons';
import { ReviewBook } from './components/ReviewBook';
import { EmptyBook } from './components/EmptyBook';
import { Agenda } from './components/Agenda';
import { Notepad } from './components/Notepad';
import { CardForm } from './components/CardForm';
import { Catalog } from './components/Catalog';
import { Tour } from './tutorial/Tour';
import { TOUR_STEPS, type TourStep } from './tutorial/steps';
import { buildDemoState } from './tutorial/demo';
import { markSeen, shouldAutoOpen } from './tutorial/engine';

function Desk({ tourStep, onHelp }: { tourStep: TourStep | null; onHelp: () => void }) {
  const { state, dispatch, isDemo } = useStore();
  const queue = dueCards(state);
  const current = queue[0] ?? null;

  const [revealed, setRevealed] = useState(false);
  const [pressing, setPressing] = useState<Quality | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const questionRef = useRef<HTMLInputElement | null>(null);

  // Al cambiar de ficha, vuelve a preguntar (colapsa la respuesta anterior).
  // Las fichas de ejemplo del tutorial no cuentan: no tocan el estado del estudiante.
  const lastRealId = useRef<string | undefined>(isDemo ? undefined : current?.id);
  useEffect(() => {
    if (isDemo || lastRealId.current === current?.id) return;
    lastRealId.current = current?.id;
    setRevealed(false);
    setPressing(null);
  }, [current?.id, isDemo]);

  // Campana al cumplir la meta: solo cuando la transición ocurre en esta sesión.
  const doneNow = goalDone(state);
  const prevDone = useRef<boolean | null>(null);
  useEffect(() => {
    if (isDemo) return;
    if (prevDone.current === null) {
      prevDone.current = doneNow;
      return;
    }
    if (doneNow && !prevDone.current) playSound('goal', state.settings.sound);
    prevDone.current = doneNow;
  }, [doneNow, state.settings.sound, isDemo]);

  function handleReveal() {
    playSound('reveal', state.settings.sound);
    setRevealed(true);
  }

  function handleRate(q: Quality) {
    if (!current || pressing !== null) return;
    playSound('stamp', state.settings.sound);
    setPressing(q);
    window.setTimeout(() => {
      dispatch({ type: 'rate', id: current.id, quality: q, today: todayKey() });
      setRevealed(false);
      setPressing(null);
    }, 320);
  }

  function focusForm() {
    questionRef.current?.focus();
  }

  return (
    <>
      <Topbar onHelp={onHelp} />
      <TodayStrip />

      <main className="desk">
        <div className="stage">
          <Ribbons counts={phaseCounts(state)} />

          {current ? (
            <ReviewBook
              card={current}
              queueLength={queue.length}
              revealed={tourStep ? !!tourStep.reveal : revealed}
              pressing={pressing}
              onReveal={handleReveal}
              onRate={handleRate}
            />
          ) : (
            <EmptyBook hasCards={state.cards.length > 0} onDefineFirst={focusForm} />
          )}

          <Agenda />
          <Catalog onEdit={(id) => { setEditingId(id); window.setTimeout(focusForm, 0); }} />
        </div>

        <div className="rail">
          <Notepad />
          <CardForm
            editingId={editingId}
            questionRef={questionRef}
            onStopEdit={() => setEditingId(null)}
          />
        </div>
      </main>

      <footer className="site-footer">
        <span>Local · React + Vite + SM-2 · sin publicar</span>
      </footer>
    </>
  );
}

/** Controla el tutorial: abre solo la primera vez y muestra fichas de ejemplo en memoria. */
function TourShell() {
  const { state } = useStore();
  const [index, setIndex] = useState<number | null>(() => (shouldAutoOpen() ? 0 : null));
  const open = index !== null;
  const sound = state.settings.sound;
  const demo = useMemo(() => (open ? buildDemoState(todayKey(), sound) : null), [open, sound]);

  function close() {
    markSeen();
    setIndex(null);
  }

  return (
    <>
      <DemoScope demo={demo}>
        <Desk tourStep={index === null ? null : TOUR_STEPS[index]} onHelp={() => setIndex(0)} />
      </DemoScope>
      {index !== null && <Tour index={index} onIndexChange={setIndex} onClose={close} />}
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <TourShell />
    </StoreProvider>
  );
}