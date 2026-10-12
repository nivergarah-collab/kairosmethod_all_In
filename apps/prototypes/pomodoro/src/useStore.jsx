import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

const StoreContext = createContext(null);

export function StoreProvider({ store, children }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** Devuelve { state, vm }: state = estado actual (se vuelve a renderizar al cambiar), vm = acciones del ViewModel. */
export function useVM() {
  const store = useContext(StoreContext);
  const state = useSyncExternalStore(store.subscribe, store.getState);
  return { state, vm: store };
}

function useSystemDark() {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const on = (e) => setDark(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return dark;
}

/** isDarkThemePref ?: isSystemInDarkTheme() */
export function useEffectiveDark() {
  const { state } = useVM();
  const systemDark = useSystemDark();
  return state.isDarkTheme ?? systemDark;
}
