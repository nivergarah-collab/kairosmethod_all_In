// ÚNICO módulo de esta visión que toca `localStorage`. Guarda solo sus ajustes (esquema versionado),
// con clave propia. Nunca guarda la sesión ni el temporizador.

import { sanear } from './ajustes.js';

export const CLAVE = 'kairos_pomodoro_vision_investigacion_v1';
export const VERSION_ESQUEMA = 1;

const almacen = () => {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
};

export function cargar() {
  const a = almacen();
  try {
    const txt = a?.getItem(CLAVE);
    if (!txt) return sanear(null);
    const o = JSON.parse(txt);
    return sanear(o && o.v === VERSION_ESQUEMA ? o.cfg : null);
  } catch { return sanear(null); }
}

export function guardar(cfg) {
  try { almacen()?.setItem(CLAVE, JSON.stringify({ v: VERSION_ESQUEMA, cfg: sanear(cfg) })); return true; } catch { return false; }
}

export function borrar() {
  try { almacen()?.removeItem(CLAVE); return true; } catch { return false; }
}
