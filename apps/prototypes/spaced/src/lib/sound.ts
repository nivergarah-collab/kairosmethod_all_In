/* Sonidos del método con WebAudio (sin archivos). */

export type SoundName = 'reveal' | 'stamp' | 'file' | 'goal';

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(ctx: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function noiseBurst(ctx: AudioContext, start: number, dur: number, vol: number) {
  const frames = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  gain.gain.value = vol;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(start);
}

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  try {
    if (name === 'reveal') {
      noiseBurst(ctx, t, 0.16, 0.14);
      tone(ctx, 880, t + 0.02, 0.12, 'triangle', 0.05);
    } else if (name === 'stamp') {
      tone(ctx, 196, t, 0.09, 'square', 0.09);
      noiseBurst(ctx, t, 0.06, 0.12);
    } else if (name === 'file') {
      noiseBurst(ctx, t, 0.14, 0.1);
      tone(ctx, 523, t + 0.05, 0.14, 'sine', 0.05);
    } else if (name === 'goal') {
      tone(ctx, 659, t, 0.18, 'sine', 0.09);
      tone(ctx, 784, t + 0.16, 0.2, 'sine', 0.09);
      tone(ctx, 1047, t + 0.32, 0.34, 'sine', 0.08);
    }
  } catch {
    /* audio no disponible: la app sigue funcionando */
  }
}