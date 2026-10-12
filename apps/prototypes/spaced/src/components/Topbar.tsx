import { useStore } from '../state/StoreContext';
import { playSound } from '../lib/sound';

export function Topbar() {
  const { state, dispatch } = useStore();

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-title">Repetición Espaciada</span>
        <span className="brand-sub">Fichero de estudio · SM-2</span>
      </div>
      <button
        className="chip"
        type="button"
        aria-pressed={state.settings.sound}
        onClick={() => {
          const next = !state.settings.sound;
          dispatch({ type: 'toggleSound' });
          if (next) playSound('file', true);
        }}
      >
        Sonido: {state.settings.sound ? 'sí' : 'no'}
      </button>
    </header>
  );
}