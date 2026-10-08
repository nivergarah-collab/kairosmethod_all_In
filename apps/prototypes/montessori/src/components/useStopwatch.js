import { useEffect, useRef, useState } from 'react';

// Cronómetro de la sesión (cuenta hacia arriba). Calcula con la hora real para no
// desfasarse si la pestaña se pone en segundo plano.
export default function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const base = useRef({ at: 0, start: 0 });

  useEffect(() => {
    if (!running) return undefined;
    base.current = { at: Date.now(), start: elapsed };
    const id = setInterval(() => {
      setElapsed(base.current.start + Math.floor((Date.now() - base.current.at) / 1000));
    }, 250);
    return () => clearInterval(id);
    // `elapsed` se lee solo al arrancar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return {
    elapsed,
    running,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    toggle: () => setRunning((r) => !r),
    reset: () => {
      setRunning(false);
      setElapsed(0);
    },
  };
}
