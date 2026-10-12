// Pasos del recorrido. Cada paso apunta a un elemento marcado con data-tour="...".
// Los pasos cuyo elemento no está en pantalla (p. ej. los de preparación durante una sesión)
// se omiten al abrir el tutorial.
//   union: resalta todos los elementos visibles con esa marca (si no, solo el primero)
//   include: selector hijo que se suma al resaltado (la barrita de controles de un elemento)
//   tools: 'open' abre el menú de herramientas mientras dura el paso (solo en pantallas anchas)
export const STEPS = [
  {
    id: 'progress', target: 'progress', icon: '🌱', title: 'Prepara tu espacio',
    text: 'Este es tu ambiente de estudio: un escritorio que armas a tu manera. Aquí ves cuántos elementos llevas listos antes de empezar.',
  },
  {
    id: 'tray', target: 'tray', icon: '🧰', title: 'La bandeja',
    text: 'Aquí están los elementos: archivo de estudio, temporizador, notas, dispositivo, música, lámpara y agua. Arrástralos al escritorio o toca «+» para agregarlos.',
  },
  {
    id: 'desk', target: 'desk', icon: '🪑', title: 'Tu escritorio',
    text: 'Mueve cada elemento arrastrándolo. Pasa el mouse o toca uno para ver sus controles: Listo, Vista, Tamaño, Configurar y Quitar.',
  },
  {
    id: 'item', target: 'item', include: '.bar', icon: '👁', title: 'Controles de cada elemento',
    text: 'Vista alterna entre icono, con nombre y en uso. Tamaño lo pasa de principal a secundario. Configurar (o doble clic) ajusta los detalles y Quitar lo saca del escritorio.',
  },
  {
    id: 'clock', target: 'clock', icon: '⏱', title: 'Cronómetro de sesión',
    text: 'Cuenta el tiempo total que estudias: inicia, pausa o reinicia (atajo: P). Puedes ocultarlo, aunque se recomienda dejarlo visible.',
  },
  {
    id: 'look', target: 'look', union: true, icon: '🎨', title: 'Fondo y aspecto',
    text: 'Elige el fondo (madera clara, escritorio oscuro o pantalla) y el aspecto de las tarjetas. Se combinan como quieras.',
  },
  {
    id: 'examples', target: 'examples', icon: '✨', title: 'Ejemplos',
    text: 'Escenas listas para probar, como «Noche de repaso». Si ya tienes elementos, te preguntamos antes de reemplazarlos.',
  },
  {
    id: 'data', target: 'data', icon: '💾', title: 'Datos',
    text: 'Tu espacio se guarda solo en este navegador. Aquí puedes descargarlo o importarlo (JSON), ver los atajos de teclado o borrar lo guardado.',
  },
  {
    id: 'tools', target: 'tools', tools: 'open', icon: '📝', title: 'Herramientas',
    text: 'Tareas, metas, distracciones y pausas, con recordatorios visuales sin sonido. Se abren con la tecla T. Anota ahí lo que quieres lograr.',
  },
  {
    id: 'session', target: 'session', icon: '🎯', title: 'Modo enfoque y fin de sesión',
    text: 'Modo enfoque (tecla F) atenúa los elementos secundarios. Al terminar la sesión verás un resumen que puedes descargar. Repite este recorrido con el botón «?».',
  },
  {
    id: 'start', target: 'start', icon: '▶', title: 'Iniciar sesión de estudio',
    text: 'Oculta lo de preparar, arranca el cronómetro y deja el escritorio, la bandeja y las herramientas. Puedes repetir este recorrido con el botón «?».',
  },
];

// Deja solo los pasos cuyo elemento existe (exists recibe el paso).
export function availableSteps(steps, exists) {
  return steps.filter((s) => !s.target || exists(s));
}
