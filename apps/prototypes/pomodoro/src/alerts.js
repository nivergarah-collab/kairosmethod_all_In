// Port de util/NotificationAlertManager.kt para el navegador.
// - Vibración: mismos patrones (navigator.vibrate, sin amplitudes; solo Android/Chrome la soporta).
// - Sonido: Android usa el tono de notificación del sistema + ToneGenerator; aquí no existe ese sonido,
//   así que se sintetizan con Web Audio tonos de la misma duración y secuencia (aproximados).

const VIBRATION = {
  BLOCK_BEGINS: [100, 80, 220],
  BLOCK_ENDS: [320, 160, 480],
  BREAK_BEGINS: [220],
  BREAK_ENDS: [140, 90, 280],
  SESSION_COMPLETE: [150, 100, 150, 100, 450],
};

// [frecuencia Hz, duración ms, pausa posterior ms]
const TONES = {
  BLOCK_BEGINS: [[880, 250, 0]], // TONE_PROP_PROMPT 250 ms
  BLOCK_ENDS: [[1200, 150, 100], [1200, 150, 0]], // TONE_PROP_BEEP2 400 ms
  BREAK_BEGINS: [[1200, 200, 0]], // TONE_PROP_ACK 200 ms
  BREAK_ENDS: [[880, 300, 0]], // TONE_PROP_PROMPT 300 ms
  SESSION_COMPLETE: [[1200, 180, 20], [1200, 180, 20], [1200, 150, 100], [1200, 150, 0]], // ACK, ACK, BEEP2
};

export function createAlertManager({ win = typeof window !== 'undefined' ? window : null } = {}) {
  let ctx = null;
  const audio = () => {
    if (!win) return null;
    const AC = win.AudioContext || win.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume?.();
    return ctx;
  };

  function playSound(type) {
    try {
      const c = audio();
      if (!c) return;
      let t = c.currentTime;
      for (const [hz, ms, pause] of TONES[type.key]) {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = hz;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.33, t + 0.01); // ToneGenerator con volumen 85/100
        gain.gain.setValueAtTime(0.33, t + ms / 1000 - 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
        osc.connect(gain).connect(c.destination);
        osc.start(t);
        osc.stop(t + ms / 1000 + 0.02);
        t += (ms + pause) / 1000;
      }
    } catch {
      /* fallo de audio: se ignora, igual que en el APK */
    }
  }

  function vibrate(pattern) {
    try {
      win?.navigator?.vibrate?.(pattern);
    } catch {
      /* sin vibración */
    }
  }

  return {
    triggerAlert(type, soundEnabled, vibrationEnabled) {
      if (soundEnabled) playSound(type);
      if (vibrationEnabled) vibrate(VIBRATION[type.key]);
    },
    /** vibrateFeedback() del ViewModel: un pulso de 70 ms al marcar un bloque. */
    vibrateFeedback() {
      vibrate(70);
    },
  };
}
