// Perfiles de la visión Investigación: puntos de partida editables para el comportamiento de la
// pantalla de sesión (avisos, avance entre fases, secuencia, tamaño). Datos puros, sin DOM.
// Los tiempos (enfoque, descansos, bloques) NO están aquí: salen de «Configurar», que es común a
// todas las visiones.

export const AVISOS_SEG = Object.freeze([0, 30, 60, 120]); // 0 = sin aviso previo
export const AVANCES = Object.freeze(['auto', 'enfoque', 'todas']);
export const TAMANOS = Object.freeze(['normal', 'grande', 'enorme']);
export const MOVIMIENTOS = Object.freeze(['sistema', 'reducir']);

const base = { cifras: true, tamano: 'normal', movimiento: 'sistema' };

export const PERFILES = Object.freeze({
  libre: Object.freeze({
    id: 'libre',
    nombre: 'Libre',
    resumen: 'Pomodoro clásico: tú decides casi todo.',
    valores: Object.freeze({ ...base, avisoSeg: 0, avance: 'auto', extension: 5, secuencia: false }),
    rangos: Object.freeze({ extension: [1, 15] }),
  }),
  guiado: Object.freeze({
    id: 'guiado',
    nombre: 'Guiado',
    resumen: 'Secuencia visible y aviso antes de cada cambio.',
    valores: Object.freeze({ ...base, avisoSeg: 60, avance: 'enfoque', extension: 5, secuencia: true }),
    rangos: Object.freeze({ extension: [1, 10] }),
  }),
  estructurado: Object.freeze({
    id: 'estructurado',
    nombre: 'Estructurado',
    resumen: 'Todo anunciado y nada avanza sin tu confirmación.',
    valores: Object.freeze({ ...base, avisoSeg: 60, avance: 'todas', extension: 2, secuencia: true, tamano: 'grande' }),
    rangos: Object.freeze({ extension: [1, 5] }),
  }),
});

export const ORDEN_PERFILES = Object.freeze(['libre', 'guiado', 'estructurado']);
export const PERFIL_INICIAL = 'libre';

export const perfilDe = (id) => PERFILES[id] ?? PERFILES[PERFIL_INICIAL];
