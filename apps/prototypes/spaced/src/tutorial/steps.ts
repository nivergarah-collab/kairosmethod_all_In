/* Pasos del tutorial guiado de Repetición Espaciada (lógica pura, sin React). */

export interface TourStep {
  id: string;
  /** Valor del atributo data-tour del elemento que se resalta. */
  target: string;
  title: string;
  text: string;
  /** true: el libro se muestra con la respuesta abierta (solo durante el tutorial). */
  reveal?: boolean;
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'today',
    target: 'today',
    title: 'Bienvenida a tu fichero',
    text:
      'Aquí ves cuántas tarjetas toca repasar hoy y cuántas llegan mañana. Para este recorrido usamos fichas de ejemplo: no se guardan.',
  },
  {
    id: 'new-card',
    target: 'card-form',
    title: 'Define tus preguntas',
    text:
      'Escribe una pregunta tuya y, si quieres, la respuesta como la recordarás. Pulsa «Archivar ficha». La app no trae contenido: tú lo defines.',
  },
  {
    id: 'ribbons',
    target: 'ribbons',
    title: 'Las cintas: fases de tus fichas',
    text:
      'Cada ficha pasa por cuatro fases según su intervalo: Nuevas, Aprendiendo, Repasando y Dominadas. Los números muestran cuántas hay en cada una.',
  },
  {
    id: 'book',
    target: 'book',
    title: 'El libro de repaso',
    text:
      'A la izquierda aparece la pregunta de la ficha. Intenta contestarla de memoria y luego pulsa «Abrir respuesta».',
  },
  {
    id: 'stamps',
    target: 'stamps',
    title: 'Sella cómo te fue',
    text:
      'Con la respuesta abierta, elige un sello: Olvidé, Difícil, Bien o Fácil. Con SM-2 la ficha vuelve antes si te costó y más tarde si la sabías.',
    reveal: true,
  },
  {
    id: 'agenda',
    target: 'agenda',
    title: 'La agenda de repasos',
    text:
      'El cajón muestra qué día vuelve cada grupo de fichas. Cambia entre vista de lista y de calendario con los botones de la derecha.',
  },
  {
    id: 'catalog',
    target: 'catalog',
    title: 'Mis preguntas',
    text:
      'Aquí está todo tu fichero. Con «Editar» cambias una pregunta o su respuesta y con «Borrar» la quitas.',
  },
  {
    id: 'notepad',
    target: 'notepad',
    title: 'Meta, racha y fecha objetivo',
    text:
      'Fija cuántas tarjetas quieres repasar por día, mira tu racha y define tu fecha objetivo (por ejemplo, el día del examen).',
  },
  {
    id: 'sound',
    target: 'actions',
    title: 'Sonido y ayuda',
    text:
      'Activa o silencia los sonidos del libro con este botón. Cuando quieras volver a ver este recorrido, pulsa «?» en la barra superior.',
  },
];
