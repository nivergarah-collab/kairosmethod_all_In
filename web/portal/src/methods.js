// Fuente única de los métodos que muestra el portal.
// status: 'available' (hay prototipo en apps/prototypes/<id>) o 'soon' (se muestra como «Próximamente»).
// Al habilitar uno: crear su prototipo, agregarlo a PAGES_REQUIRED_PROTOTYPES y al <noscript> de index.html.
export const methods = [
  { id: 'montessori', name: 'Montessori', summary: 'Arma tu escritorio de estudio y trabaja a tu propio ritmo.', status: 'available' },
  { id: 'pomodoro', name: 'Pomodoro', summary: 'Bloques de enfoque con descansos cortos para mantener la atención.', status: 'soon' },
  { id: 'kaizen', name: 'Kaizen', summary: 'Mejora continua con pasos pequeños y constantes.', status: 'soon' },
  { id: 'por-definir', name: 'Por definir', summary: 'Un nuevo método de estudio está en camino.', status: 'soon' },
];

export const isAvailable = (method) => method.status === 'available';

// base viene de import.meta.env.BASE_URL (p. ej. '/kairosmethod/' o '/').
export function prototypeHref(base, id) {
  const root = base.endsWith('/') ? base : `${base}/`;
  return `${root}prototypes/${id}/`;
}
