// Esquema de ajustes de la visión Investigación: fuente única de qué se puede ajustar, su ayuda y su
// saneamiento. Sin DOM: el panel de ajustes se construye a partir de esta lista.

import { PERFILES, perfilDe, PERFIL_INICIAL, AVISOS_SEG, AVANCES, TAMANOS, MOVIMIENTOS } from './perfiles.js';

const num = (clave, etiqueta, ayuda, unidad) => ({ clave, etiqueta, ayuda, tipo: 'numero', unidad });
const opc = (clave, etiqueta, ayuda, opciones) => ({ clave, etiqueta, ayuda, tipo: 'opciones', opciones });
const sw = (clave, etiqueta, ayuda) => ({ clave, etiqueta, ayuda, tipo: 'interruptor' });

export const GRUPOS = Object.freeze([
  {
    id: 'avisos',
    titulo: 'Avisos y avance',
    ajustes: [
      opc('avisoSeg', 'Aviso antes de cada cambio', 'Un mensaje en pantalla antes de que termine la fase; «Sin aviso» lo desactiva.',
        AVISOS_SEG.map((v) => ({ valor: v, texto: v === 0 ? 'Sin aviso' : v < 60 ? `${v} segundos antes` : `${v / 60} min antes` }))),
      opc('avance', 'Cuándo empieza la siguiente fase', 'Elige si las fases empiezan solas o si esperan a que pulses el botón.',
        AVANCES.map((v) => ({ valor: v, texto: v === 'auto' ? 'Siempre sola' : v === 'enfoque' ? 'Espera antes de cada enfoque' : 'Espera en cada fase' }))),
      num('extension', 'Minutos extra por pulsación', 'Cuántos minutos se suman a la fase al pulsar «+ min».', 'min'),
    ],
  },
  {
    id: 'pantalla',
    titulo: 'Pantalla',
    ajustes: [
      sw('cifras', 'Mostrar el tiempo en números', 'Muestra los minutos y segundos además del círculo de progreso.'),
      sw('secuencia', 'Mostrar la secuencia completa', 'Muestra la lista de fases y la hora estimada de término.'),
      opc('tamano', 'Tamaño del texto', 'Cambia el tamaño del texto de esta pantalla.',
        TAMANOS.map((v) => ({ valor: v, texto: v === 'normal' ? 'Normal' : v === 'grande' ? 'Grande' : 'Muy grande' }))),
      opc('movimiento', 'Movimiento en pantalla', 'Con «Reducir» no hay ninguna animación, sin importar el dispositivo.',
        MOVIMIENTOS.map((v) => ({ valor: v, texto: v === 'sistema' ? 'Según el dispositivo' : 'Reducir siempre' }))),
    ],
  },
]);

export const TODOS_LOS_AJUSTES = Object.freeze(GRUPOS.flatMap((g) => g.ajustes));

const entero = (v) => typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v);

/** Valores de un perfil (copia). */
export const valoresDePerfil = (perfilId) => ({ perfil: perfilDe(perfilId).id, ...perfilDe(perfilId).valores });

/** Sanea cualquier objeto a una configuración válida. Nunca lanza. */
export function sanear(raw) {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const perfil = typeof r.perfil === 'string' && Object.hasOwn(PERFILES, r.perfil) ? r.perfil : PERFIL_INICIAL;
  const p = PERFILES[perfil];
  const out = { perfil };
  for (const a of TODOS_LOS_AJUSTES) {
    const def = p.valores[a.clave];
    const v = r[a.clave];
    if (a.tipo === 'numero') {
      const [min, max] = p.rangos[a.clave];
      out[a.clave] = entero(v) && v >= min && v <= max ? v : def;
    } else if (a.tipo === 'interruptor') {
      out[a.clave] = typeof v === 'boolean' ? v : def;
    } else {
      out[a.clave] = a.opciones.some((o) => o.valor === v) ? v : def;
    }
  }
  return out;
}

/** Cambia un ajuste y devuelve la configuración saneada. */
export const ajustar = (cfg, clave, valor) => sanear({ ...cfg, [clave]: valor });

/** Cambia de perfil: aplica todos los valores del perfil elegido. */
export const elegirPerfil = (perfilId) => sanear(valoresDePerfil(perfilId));

export const rangoDe = (cfg, clave) => perfilDe(cfg.perfil).rangos[clave];
