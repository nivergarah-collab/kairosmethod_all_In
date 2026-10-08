// Ejemplos seleccionables (spec 10): escenas de estudio reconocibles, definidas como datos.
// Cada elemento: [tipo, x, y, vista, tamaño, configuración]. Todo pasa por el mismo
// saneamiento que el guardado (`exampleWorkspace`), así que un ejemplo nunca puede dejar
// el escritorio en un estado que la app no sabría leer. Sin nombres ni datos reales.
import { sanitizeSaved } from './storage.js';
import { itemIcon } from './state.js';

export const EXAMPLES = [
  {
    id: 'noche-repaso',
    name: 'Noche de repaso',
    description: 'Escritorio oscuro, lámpara encendida y el temporizador al centro.',
    background: 'dark',
    template: 'screen',
    items: [
      ['timer', 36, 44, 'live', 'main', { minutes: 25 }],
      ['lamp', 14, 24, 'live', 'side', { on: true }],
      ['music', 74, 26, 'named', 'side', { mood: 'Naturaleza', playlist: 'Playlist: lluvia suave' }],
      ['water', 82, 66, 'live', 'side', { filled: true }],
      ['notes', 56, 76, 'named', 'side', { title: 'Para esta noche', text: 'Repasar el capítulo 3 antes de dormir' }],
    ],
    goals: ['Repasar el capítulo 3 antes de dormir'],
    tasks: ['Resolver los ejercicios 4 al 8', 'Anotar las dudas para mañana'],
  },
  {
    id: 'lectura-tranquila',
    name: 'Lectura tranquila',
    description: 'Madera clara, notas a la vista, lámpara cálida y un vaso de agua lleno.',
    background: 'wood',
    template: 'table',
    items: [
      ['notes', 38, 44, 'live', 'main', { title: 'Lo que voy leyendo', text: 'Idea central del capítulo: lo importante es entender el porqué antes de memorizar.' }],
      ['lamp', 84, 22, 'live', 'side', { on: true }],
      ['water', 76, 68, 'live', 'main', { filled: true }],
      ['file', 16, 72, 'named', 'side', { name: 'Capítulo 2', kind: 'Libro' }],
    ],
    goals: ['Leer veinte páginas sin interrupciones'],
    tasks: ['Subrayar las ideas principales'],
  },
  {
    id: 'tarea-larga',
    name: 'Tarea larga',
    description: 'Escritorio de pantalla con la guía y el computador como protagonistas.',
    background: 'monitor',
    template: 'screen',
    items: [
      ['file', 28, 28, 'live', 'main', { name: 'Guía de ejercicios', kind: 'PDF' }],
      ['device', 66, 52, 'live', 'main', { device: 'PC', role: 'Estudiar' }],
      ['timer', 86, 78, 'named', 'side', { minutes: 50 }],
      ['notes', 16, 78, 'named', 'side', { title: 'Pausas a mano', text: 'Cada 50 minutos: pararme, estirar y tomar agua.' }],
    ],
    goals: ['Terminar la guía completa'],
    tasks: ['Ejercicios 1 al 5', 'Ejercicios 6 al 10', 'Revisar las respuestas'],
  },
  {
    id: 'manana-examen',
    name: 'Mañana antes del examen',
    description: 'Pocos elementos: notas grandes, agua y un temporizador corto.',
    background: 'wood',
    template: 'screen',
    items: [
      ['notes', 38, 44, 'live', 'main', { title: 'Último repaso', text: 'Fórmulas clave, definiciones y los dos errores que siempre cometo.' }],
      ['water', 80, 30, 'live', 'side', { filled: true }],
      ['timer', 74, 70, 'live', 'main', { minutes: 30 }],
    ],
    goals: ['Llegar tranquilo al examen'],
    tasks: ['Releer mi resumen una vez'],
  },
  {
    id: 'estudio-celular',
    name: 'Estudio en el celular',
    description: 'Disposición simple y despejada, pensada para una pantalla chica.',
    background: 'dark',
    template: 'table',
    items: [
      ['device', 50, 34, 'live', 'main', { device: 'Celular', role: 'Estudiar' }],
      ['timer', 26, 72, 'named', 'side', { minutes: 20 }],
      ['music', 74, 72, 'icon', 'side', { mood: 'Lo-fi', playlist: 'Lo-fi para el bus' }],
    ],
    goals: ['Repasar las tarjetas del día'],
    tasks: ['Diez minutos de tarjetas de repaso'],
  },
  {
    id: 'escritorio-minimo',
    name: 'Escritorio mínimo',
    description: 'Solo el temporizador y una lámpara, para empezar sin ruido.',
    background: 'monitor',
    template: 'table',
    items: [
      ['timer', 46, 46, 'live', 'main', { minutes: 25 }],
      ['lamp', 80, 28, 'icon', 'side', { on: false }],
    ],
    goals: [],
    tasks: [],
  },
];

// Devuelve { workspace, goals, tasks } listo para aplicar, o null si el ejemplo no existe.
// `startId` es el siguiente identificador libre de elementos.
export function exampleWorkspace(id, startId = 1) {
  const ex = EXAMPLES.find((e) => e.id === id);
  if (!ex) return null;
  const clean = sanitizeSaved({
    schema: 1,
    workspace: {
      background: ex.background,
      template: ex.template,
      nextId: startId + ex.items.length,
      items: ex.items.map(([type, x, y, view, size, config], i) => ({
        id: startId + i, type, x, y, done: false, view, size, config,
      })),
    },
    lists: {},
  });
  if (!clean) return null;
  return {
    workspace: { items: clean.items, nextId: clean.nextId, background: clean.background, template: clean.template },
    goals: ex.goals,
    tasks: ex.tasks,
  };
}

// Miniatura del selector: los iconos de los elementos en orden.
export const exampleGlyphs = (ex) =>
  exampleWorkspace(ex.id).workspace.items.map((i) => itemIcon(i)).join(' ');
