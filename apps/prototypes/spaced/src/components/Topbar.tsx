import { useStore } from '../state/StoreContext';
import { playSound } from '../lib/sound';

interface Props {
  /** Abre el tutorial guiado. */
  onHelp: () => void;
}

export function Topbar({ onHelp }: Props) {
  const { state, dispatch } = useStore();

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-title">Repetición Espaciada</span>
        <span className="brand-sub">Fichero de estudio · SM-2</span>
      </div>
      <div className="topbar-actions" data-tour="actions">
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
        <button
          className="chip chip-help"
          type="button"
          data-tour="help"
          aria-label="Ver tutorial"
          title="Ver tutorial"
          onClick={onHelp}
        >
          ?
        </button>
      </div>
    </header>
  );
}
