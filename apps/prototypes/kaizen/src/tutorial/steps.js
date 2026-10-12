// Pasos del recorrido. Cada paso describe qué mostrar (target = selectores data-tour) y en qué estado dejar la app (scene).
// scene.view: vista de la app · scene.garden: 'plants' | 'empty' (jardín de ejemplo en memoria)
// scene.select: elegir la primera planta · scene.detail: abrir sus detalles · scene.details/demo: paneles del jardín.
const t = (name) => `[data-tour="${name}"]`;
const BASE = { view: 'garden', garden: 'plants', select: false, detail: false, details: false, demo: false };
const scene = (overrides = {}) => ({ ...BASE, ...overrides });

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Un jardín para crecer',
    body: 'Cada hábito de estudio es una planta pequeña que cuidas un día a la vez. Este recorrido usa plantas de ejemplo: tu jardín no cambia.',
    target: null,
    scene: scene(),
  },
  {
    id: 'seeds',
    title: 'Empieza con una semilla',
    body: 'Con el jardín vacío eliges una de tres semillas, una por familia: Comprender, Practicar o Reflexionar. Cada hábito empieza en incubación. También puedes crear tu propia microacción.',
    target: [t('seed-picker')],
    prefer: 'bottom',
    scene: scene({ garden: 'empty' }),
  },
  {
    id: 'zones',
    title: 'Cuatro rincones',
    body: 'Tu espacio tiene cuatro rincones: Invernadero, Balcón, Rincón de lectura y Zona de trabajo. Cambia con las flechas o deslizando el dedo.',
    target: [t('zone-heading'), t('zone-prev'), t('zone-next')],
    prefer: 'bottom',
    scene: scene(),
  },
  {
    id: 'plant',
    title: 'Cada planta es un hábito',
    body: 'Toca una planta para elegirla. Crece con tus cuidados: de semilla en incubación a planta establecida.',
    target: [`${t('plant')} .plant-cutout`],
    prefer: 'top',
    scene: scene(),
  },
  {
    id: 'care',
    title: 'Cuida una vez al día',
    body: 'Al elegir una planta ves su microacción. Pulsa «Lo hice · cuidar» cuando la hagas y suma crecimiento. Si un día te pausas, no pierdes progreso. «Llevar a» la cambia de rincón.',
    target: [t('care-dock')],
    prefer: 'top',
    scene: scene({ select: true }),
  },
  {
    id: 'detail',
    title: 'El desafío de cada planta',
    body: '«Ver desafío» abre sus detalles: microacción, frecuencia, vitalidad e historial. Desde ahí puedes editarla o congelarla en el herbario.',
    target: [t('plant-detail')],
    prefer: 'right',
    scene: scene({ select: true, detail: true }),
  },
  {
    id: 'controls',
    title: 'Ver detalles y organizar',
    body: '«Ver detalles» muestra el nombre y la fase de cada planta. «Organizar plantas» te deja arrastrarlas, o moverlas con las flechas del teclado, hasta donde quieras.',
    target: [t('scene-controls')],
    prefer: 'bottom',
    scene: scene({ details: true }),
  },
  {
    id: 'time',
    title: 'Explora el paso del tiempo',
    body: '«Explorar el tiempo» abre el reloj virtual: avanza días, simula una semana saludable o una recuperación. Solo cambia el jardín guardado, nunca la hora de tu dispositivo.',
    target: [t('demo-panel')],
    prefer: 'top',
    scene: scene({ demo: true }),
  },
  {
    id: 'menu',
    title: 'Menú del jardín',
    body: '«Nueva planta» crea una microacción propia, el Vivero ofrece semillas extra, el Herbario guarda plantas congeladas y Ajustes maneja tus copias.',
    target: [t('nav')],
    prefer: 'bottom',
    scene: scene(),
  },
  {
    id: 'form',
    title: 'Crea tu microacción',
    body: 'Elige familia y enfoque, ponle nombre y escribe algo pequeño y fácil de repetir. Puedes añadir la frecuencia y un momento o lugar que te lo recuerde.',
    target: [t('plant-form')],
    prefer: 'right',
    scene: scene({ view: 'new' }),
  },
  {
    id: 'nursery',
    title: 'Vivero',
    body: 'Una semana cuidando todas tus plantas abre dos semillas nuevas. En la demo puedes simular esa semana para verlas.',
    target: [t('nursery')],
    prefer: 'right',
    scene: scene({ view: 'nursery' }),
  },
  {
    id: 'herbarium',
    title: 'Herbario',
    body: 'Las plantas congeladas conservan su recorrido, salud e historial. Puedes replicarlas para empezar de nuevo o eliminarlas.',
    target: [t('herbarium')],
    prefer: 'right',
    scene: scene({ view: 'herbarium' }),
  },
  {
    id: 'settings',
    title: 'Ajustes y copias',
    body: 'Exporta tu jardín en un archivo JSON, recupera una copia o empieza de nuevo. Todo se guarda solo en este dispositivo.',
    target: [t('settings')],
    prefer: 'right',
    scene: scene({ view: 'settings' }),
  },
  {
    id: 'help',
    title: '¿Quieres repasarlo?',
    body: 'El botón «?» vuelve a abrir este recorrido cuando lo necesites. ¡Disfruta tu jardín!',
    target: [t('help')],
    prefer: 'bottom',
    scene: scene(),
  },
];

// Dos pasos con la misma firma comparten escena y no obligan a reiniciarla.
export function sceneSignature(step) {
  const { garden, select, detail, details, demo } = step.scene;
  return [garden, select, detail, details, demo].join('|');
}
