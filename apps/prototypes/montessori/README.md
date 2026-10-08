# Prototipo montessori

Borrador de la sección **montessori** (KAN-14): un **ambiente de estudio** que se arma como un escritorio real y se usa durante toda la sesión. Proyecto React (Vite) responsive, solo web.

Versión `0.5.13` (la fuente es el campo `version` de `package.json`; el primer número oficial lo define el equipo).

## Qué hace

- **Una sola pantalla** (`100dvh`, sin scroll de página): barra superior, escritorio ocupando casi todo el alto y **bandeja** de elementos abajo (fila fija con scroll horizontal).
- **Cronómetro de sesión** en la barra superior (cuenta hacia arriba: iniciar, pausar, reiniciar; se puede ocultar, aunque se recomienda dejarlo visible).
- **Bandeja**: se arrastra un elemento al escritorio; en celular se toca la ficha o el botón «+» (siempre disponible por accesibilidad).
- **Elementos**: Archivo de estudio, Temporizador (cuenta regresiva 1–120 min), Sector de notas, Dispositivo, Música (solo referencia escrita), Lámpara y Agua.
- **Tres vistas** por elemento, que cambian con la barrita: *Icono* (inicial), *Con nombre* y *En uso* (el elemento convertido en widget: anillo del temporizador, lámpara que ilumina el escritorio, vaso que se llena, memo editable, etc.).
- **Tamaño** principal o secundario, independiente de la vista y cambiable en cualquier momento.
- **Controles al pasar el mouse o tocar** (Listo, Vista, Tamaño, Configurar, Quitar), en una barrita pegada al borde. Doble clic (o doble toque) o Enter abren la configuración; las flechas mueven el elemento; con el elemento enfocado, `V` cambia la vista, `S` el tamaño y `Supr` lo quita.
- **Tres fondos** dibujados con SVG/CSS (madera clara, escritorio oscuro, pantalla) y **dos aspectos** de tarjeta (Escritorio de pantalla, Mesa de estudio), combinables.
- «Listo» y el avance de preparación existen solo en la fase de preparación.
- **Modo sesión** («Iniciar sesión de estudio»): se ocultan título, avance, el selector de ejemplos, «Vaciar» y los selectores; el cronómetro arranca solo. Quedan el escritorio, el cronómetro, la bandeja y el menú de herramientas, más un botón discreto «Terminar sesión».
- **Modo enfoque** (en sesión): atenúa los elementos de tamaño secundario.
- **Resumen final** al terminar (duración, tareas hechas, metas, notas, distracciones) con descarga en JSON. El escritorio queda; tareas y metas se limpian.
- **Menú de herramientas** (barra derecha, tecla `T`; `P` inicia/pausa el cronómetro; `F` activa el modo enfoque en sesión): pestañas tipo inventario — Tareas, Metas, Distracciones y Pausas (recordatorios visuales, sin sonido ni notificaciones del sistema). Las pestañas se recorren con flechas, Inicio y Fin. El menú «Datos» lista todos los atajos de teclado.
- **Ejemplos seleccionables** (menú «Ejemplos», solo en preparación): 6 escenas definidas como datos en `src/examples.js` (Noche de repaso, Lectura tranquila, Tarea larga, Mañana antes del examen, Estudio en el celular, Escritorio mínimo). Cada una pasa por el mismo saneamiento que el guardado; si ya tienes tareas o metas se conservan.
- **Confirmación** antes de vaciar el escritorio o de cargar un ejemplo sobre un escritorio con elementos.
- El **temporizador** avisa al llegar a cero (anillo ámbar, sin sonido) y los relojes no se anuncian cada segundo a los lectores de pantalla.
- Adaptado a celular (360 px), tablet y pantallas bajas en horizontal.

- **Guardado básico en localStorage** (con try/catch): espacio (elementos, posiciones, tamaños, vistas, fondo, aspecto, estado de lámpara y vaso), lista de tareas, metas y distracciones. Todo lo leído se valida y sanea, con número de versión del esquema (`schema: 1`); si está corrupto o es de otra versión se ignora y se parte limpio. Menú **Datos**: descargar el espacio en JSON y «Borrar datos guardados». Nada sale del navegador. Importar el espacio desde un JSON descargado (extra, con validación estricta).

Fuera de alcance: cuentas, servidor, sonido, APIs de música, visor de archivos, ventanas flotantes.

## Estructura

```
src/state.js               lógica pura (reducer, validaciones, progreso, formato de reloj)
src/state.test.js          pruebas de la lógica (node --test)
src/examples.js            escenas de ejemplo definidas como datos
src/examples.test.js       pruebas de los ejemplos
src/App.jsx                pantalla única
src/components/Topbar.jsx  barra superior (cronómetro, fondo, aspecto, avance)
src/components/Desk.jsx    escritorio y resplandor de lámparas
src/components/Backdrop.jsx fondos dibujados
src/components/ItemCard.jsx tarjeta con barrita de controles
src/components/elements/ un componente de vista por tipo (TimerLive.jsx, LampLive.jsx, …), más Basic.jsx (icono y con nombre) e index.jsx (despacho y tamaños)
src/components/Tray.jsx    bandeja inferior
src/components/Tools.jsx   menú de herramientas (pestañas)
src/components/SummaryDialog.jsx resumen final (con listas de tareas y metas)
src/components/ConfirmDialog.jsx confirmación modal reutilizable
src/download.js            descarga de JSON (Blob + enlace)
src/storage.js             guardado, validación y saneamiento (localStorage)
src/storage.test.js        pruebas del guardado
src/styles.css             estilos
```

## Comandos

```bash
npm ci            # instalar dependencias
npm run dev       # desarrollo
npm test          # pruebas de la lógica (node --test, sin librerías extra)
npm run build     # genera dist/ (acepta --base=/prototypes/montessori/)
```

Ubicación: `apps/prototypes/montessori/`. `infra/scripts/build-site.sh` lo compila para GitHub Pages en `/<repo>/prototypes/montessori/` (ver [docs/despliegue.md](../../../docs/despliegue.md)).
