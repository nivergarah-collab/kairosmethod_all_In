import { useEffect, useRef, useState } from 'react';

// Cuenta regresiva del Temporizador. Vive en la tarjeta (no en la vista) para que siga
// corriendo aunque la persona cambie de vista o de tamaño. Sin sonido ni notificaciones.
export default function useCountdown(totalSeconds, enabled) {
  const [left, setLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const endRef = useRef(0);

  // Si cambia la duración configurada, se reinicia.
  useEffect(() => {
    setLeft(totalSeconds);
    setRunning(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (!enabled || !running) return undefined;
    endRef.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) setRunning(false);
    }, 250);
    return () => clearInterval(id);
    // `left` se lee solo al arrancar: el cálculo posterior usa la hora de término.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, enabled]);

  return {
    left,
    running,
    total: totalSeconds,
    toggle: () => left > 0 && setRunning((r) => !r),
    reset: () => {
      setRunning(false);
      setLeft(totalSeconds);
    },
  };
}
