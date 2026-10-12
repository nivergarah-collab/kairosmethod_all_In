// Pasos del recorrido. Cada paso apunta a elementos marcados con data-tour="..." (si hay varios con
// la misma marca se resalta el conjunto) y dice en qué pestaña de la app se muestra:
//   tab: 0 = Configurar, 1 = Temporizador, 2 = Estadísticas, null = la que esté abierta
//   demo: el paso necesita una sesión en curso (si no hay ninguna, el recorrido inicia una de
//         muestra, en memoria, y la descarta al salir de esas pestañas; no se guarda nada)
export const STEPS = [
  {
    id: 'welcome', tab: 0, target: null, icon: '🍅', title: 'Bienvenido a PomoStudy',
    text: 'Estudia en bloques enfocados con descansos inteligentes. Te mostramos cada parte en pocos pasos; puedes saltar el tutorial cuando quieras.',
  },
  {
    id: 'profile', tab: 0, target: 'profile', icon: '🚀', title: 'Tu perfil y tu meta',
    text: 'Cada perfil guarda sus propias sesiones y estadísticas. «Cambiar» elige o crea otro perfil, y «Ajustar» fija cuántos minutos quieres estudiar hoy.',
  },
  {
    id: 'presets', tab: 0, target: 'presets', icon: '⚡', title: 'Plantillas rápidas',
    text: 'Atajos con bloques y descansos ya pensados, como «Clásico Pomodoro» (4 bloques de 25 min). Desliza para ver más.',
  },
  {
    id: 'topic', tab: 0, target: 'topic', icon: '📚', title: 'Materia y tema',
    text: 'Escribe qué vas a estudiar o toca una sugerencia. El subtema es tu objetivo principal de la sesión.',
  },
  {
    id: 'sliders', tab: 0, target: 'sliders', icon: '🎚️', title: 'Bloques y descansos',
    text: 'Elige cuántos bloques harás, cuánto dura cada uno y la duración del descanso corto y del largo (cada 4 bloques).',
  },
  {
    id: 'prefs', tab: 0, target: 'prefs', icon: '🔔', title: 'Tema y alertas',
    text: 'Cambia entre tema claro y oscuro. Activa o apaga el sonido y la vibración al empezar y terminar cada bloque, y pruébalos aquí mismo.',
  },
  {
    id: 'blockgoals', tab: 0, target: 'blockgoals', icon: '📝', title: 'Objetivo por bloque',
    text: 'Opcional: toca para escribir qué harás en cada bloque. Si lo dejas vacío, se usa tu tema.',
  },
  {
    id: 'start', tab: 0, target: 'start', icon: '▶️', title: 'Iniciar la sesión',
    text: 'Cuando estés listo, inicia: te llevamos al temporizador. Ahora verás una sesión de muestra; no se guarda nada.',
  },
  {
    id: 'session-header', tab: 1, demo: true, target: 'session-header', icon: '🎯', title: 'Tu sesión en curso',
    text: 'Arriba ves el tema y el subtema. Los atajos activan o silencian el sonido, la vibración y el tema sin salir de la pantalla.',
  },
  {
    id: 'timer-arc', tab: 1, demo: true, target: 'timer-arc', icon: '⏱️', title: 'El temporizador',
    text: 'El arco muestra la fase (enfoque o descanso) y el tiempo que queda. Pasa solo de un bloque al descanso siguiente.',
  },
  {
    id: 'timer-controls', tab: 1, demo: true, target: 'timer-controls', icon: '⏯️', title: 'Controles',
    text: '«+5m» suma cinco minutos, el botón grande pausa o reanuda, y «Siguiente» salta a la fase que sigue.',
  },
  {
    id: 'block-banner', tab: 1, demo: true, target: 'block-banner', icon: '✅', title: 'Marca tus bloques',
    text: '«Marcar bloque como completado» anota tu avance. «Cancelar» descarta la sesión sin guardar y «Finalizar y Guardar» la cierra y te pide notas y calificación.',
  },
  {
    id: 'blocks', tab: 1, demo: true, target: 'blocks', icon: '📋', title: 'Progreso de bloques',
    text: 'La lista muestra todos los bloques y destaca el actual. Toca el círculo de uno para marcarlo o desmarcarlo.',
  },
  {
    id: 'stats-goal', tab: 2, target: 'stats-goal', icon: '🎯', title: 'Meta diaria',
    text: 'Aquí ves cuánto llevas hoy frente a tu meta. «Ajustar» la cambia en cualquier momento.',
  },
  {
    id: 'stats-kpis', tab: 2, target: 'stats-kpis', icon: '📊', title: 'Tus números',
    text: 'Tiempo total de enfoque, sesiones registradas, bloques hechos y la calificación promedio de tus sesiones.',
  },
  {
    id: 'stats-week', tab: 2, target: 'stats-week', icon: '📅', title: 'Resumen semanal',
    text: 'Horas por día frente a tu meta. Usa las flechas para ver otras semanas y toca una barra para ver su detalle.',
  },
  {
    id: 'history', tab: 2, target: 'history', icon: '🗂️', title: 'Actividad e historial',
    text: 'Cada sesión guardada aparece aquí con su tiempo, bloques, nota y calificación. El bote de basura elimina una sesión.',
  },
  {
    id: 'help', tab: null, target: 'help', icon: '❓', title: 'Ayuda siempre a mano',
    text: 'Para repetir este recorrido toca «?» (Ayuda). ¡Buen estudio!',
  },
];

// Pestañas válidas de la app.
export const TABS = [0, 1, 2];
