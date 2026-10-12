import { useEffect, useRef, useState } from 'react';
import type { Quality } from './types';
import { StoreProvider, useStore } from './state/StoreContext';
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

function Desk() {
  const { state, dispatch } = useStore();
  const queue = dueCards(state);
  const current = queue[0] ?? null;

  const [revealed, setRevealed] = useState(false);
  const [pressing, setPressing] = useState<Quality | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const questionRef = useRef<HTMLInputElement | null>(null);

  // Al cambiar de ficha, vuelve a preguntar (colapsa la respuesta anterior).
  useEffect(() => {
    setRevealed(false);
    setPressing(null);
  }, [current?.id]);

  // Campana al cumplir la meta: solo cuando la transición ocurre en esta sesión.
  const doneNow = goalDone(state);
  const prevDone = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevDone.current === null) {
      prevDone.current = doneNow;
      return;
    }
    if (doneNow && !prevDone.current) playSound('goal', state.settings.sound);
    prevDone.current = doneNow;
  }, [doneNow, state.settings.sound]);

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
      <Topbar />
      <TodayStrip />

      <main className="desk">
        <div className="stage">
          <Ribbons counts={phaseCounts(state)} />

          {current ? (
            <ReviewBook
              card={current}
              queueLength={queue.length}
              revealed={revealed}
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

export default function App() {
  return (
    <StoreProvider>
      <Desk />
    </StoreProvider>
  );
}