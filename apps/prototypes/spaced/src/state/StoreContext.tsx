import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import type { AppState } from '../types';
import { loadState, saveState } from '../lib/storage';
import { reducer, type Action } from './reducer';

interface StoreValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  /** true mientras se muestran datos de ejemplo del tutorial (solo lectura, en memoria). */
  isDemo: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch, isDemo: false }}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}

const noopDispatch: Dispatch<Action> = () => {};

/** Sustituye el estado por uno de ejemplo (solo lectura): nada se guarda.
 *  Mantiene siempre el mismo Provider para no remontar los hijos al abrir/cerrar. */
export function DemoScope({ demo, children }: { demo: AppState | null; children: ReactNode }) {
  const parent = useStore();
  const value: StoreValue = demo ? { state: demo, dispatch: noopDispatch, isDemo: true } : parent;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
