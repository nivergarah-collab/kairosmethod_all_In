// Qué hay que cambiar en la app para mostrar un paso (lógica pura; Tutorial.jsx lo aplica).
//   step: paso del recorrido (ver steps.js)
//   sessionActive: ¿hay una sesión en curso en la app?
//   demoStarted: ¿esa sesión la inició el propio tutorial?
//   tab: pestaña abierta ahora
// Devuelve { startDemo, stopDemo, setTab } (setTab es el número de pestaña o null si no cambia).
export function planView({ step, sessionActive, demoStarted, tab }) {
  const startDemo = Boolean(step.demo) && !sessionActive;
  // La sesión de muestra se descarta en cuanto el recorrido sale de los pasos que la necesitan.
  const stopDemo = !step.demo && demoStarted;
  const wanted = step.tab ?? null;
  // Al iniciar o descartar la sesión de muestra la app cambia de pestaña sola: se vuelve a pedir la del paso.
  const setTab = wanted === null ? (stopDemo ? tab : null) : wanted !== tab || startDemo || stopDemo ? wanted : null;
  return { startDemo, stopDemo, setTab };
}

// Lo que pasa al terminar o saltar: si el tutorial inició una sesión de muestra se descarta, y la app
// vuelve a la pestaña en que estaba al abrirlo.
export function planExit({ demoStarted, initialTab, tab }) {
  return { stopDemo: demoStarted, setTab: demoStarted || initialTab !== tab ? initialTab : null };
}
