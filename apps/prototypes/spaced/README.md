# Repetición Espaciada · app local (React + Vite + SM-2)

Apartado independiente de la futura app que reunirá los métodos de estudio
(Montessori, Pomodoro, Kaizen, SQ3R). Prototipo web sin backend; se publica junto
con el resto de prototipos. Autoría del prototipo: ST-opc.

## La idea (filosofía)

Esta app **no entrega respuestas ni contenido** de estudio: es un estante donde
tú defines las preguntas que quieres poder responder durante un **periodo de
tiempo** (por ejemplo, hasta el día del examen). Escribir tu propia pregunta y
tu respuesta ya es parte del aprendizaje (efecto de generación: se retiene
mejor lo que uno mismo produce).

- La app arranca **vacía**: sin fichas de ejemplo.
- La pregunta es obligatoria; la respuesta la escribes tú y es **opcional**
  (puedes repasarla en voz alta y sellar sin escribirla).
- Cada ficha se reprograma con el método **SM-2** según lo bien que la
  recordaste.

## Cómo arrancar el programa

**Requisitos:** Node.js 20 o superior y npm.

```bash
npm install        # solo la primera vez
npm run dev        # abre http://localhost:3001
```

Otros comandos:

```bash
npm run test       # pruebas (Vitest)
npm run lint       # revisión de tipos (tsc --noEmit)
npm run build      # build de producción en dist/
npm run preview    # sirve el build
```

> El puerto es 3001 a propósito, para no chocar con el hub (que usa 3000) si
> ambos corren a la vez.

### Flujo de estudio

1. Define una fecha objetivo en el **notepad** (ej. el día del examen). Verás
   cuántos días faltan.
2. Rellena **Ficha nueva** con una pregunta tuya y, si quieres, la respuesta
   como la recordarás.
3. Cuando haya fichas vencidas, el **libro** muestra la pregunta. Intenta
   contestarla, pulsa **Abrir respuesta** y **sella** cómo te fue:

| Sello | Escala SM-2 | Efecto |
|---|---|---|
| Olvidé | q = 1 | Reinicia la secuencia; vuelve a entrar hoy, al final de la cola |
| Difícil | q = 3 | E-Factor −0,14; espacia algo menos |
| Bien | q = 4 | E-Factor igual; espacia según la curva (el sello estándar) |
| Fácil | q = 5 | E-Factor +0,1; espacia algo más |

La **meta del día**, la **racha** y el **periodo** se guardan solos en el
navegador. En **Mis preguntas** (catálogo) puedes editar o borrar tus fichas.

## Tutorial

Versión 3.1.0. La primera vez que se entra, se abre un recorrido guiado de 9
pasos que oscurece la pantalla y resalta cada parte: fichas de hoy, ficha
nueva, cintas, libro, sellos, agenda, «Mis preguntas», meta/racha/fecha
objetivo y sonido. Se puede saltar, volver atrás o cerrar con Escape (flechas
← → también navegan). El botón **?** de la barra superior («Ver tutorial») lo
vuelve a abrir.

- Muestra **fichas de ejemplo solo en memoria**: no se guardan ni tocan tus
  datos reales.
- Recuerda que ya se vio con la clave `kairos_spaced_tutorial_v1` (distinta de
  la de datos); si el almacenamiento está bloqueado, la app funciona igual.
- Código en `src/tutorial/` (lógica pura en `engine.ts`, pasos en `steps.ts`,
  ejemplos en `demo.ts`); los elementos se marcan con `data-tour="..."`.

## El método (investigación resumida)

Basado en la especificación original de SM-2 de P.A. Wozniak (SuperMemo,
decisis de 1987-1989):

- El **efecto de espaciamiento** (Ebbinghaus, 1885) dice que repasar justo
  antes de olvidar fija mejor que repasar seguido. El **sesgo** de SM-2 es
  espaciar cada vez más cada ficha.
- SM-2 asigna a cada ficha un **E-Factor** (inicial 2,5, piso 1,3) que crece o
  decrece con las calificaciones:
  `EF' = EF + (0,1 - (5 - q) * (0,08 + (5 - q) * 0,02))` (con q = 4 no cambia).
- Intervalos `I(1) = 1`, `I(2) = 6`, `I(n) = I(n-1) * EF` (redondeado hacia
  arriba); si la respuesta fue inferior a 3, la secuencia reinicia **sin**
  cambiar el E-Factor. Se aplica un tope de 3650 días (10 años).
- Con 4 sellos se usan q = 1, 3, 4 y 5 (la escala 0-5 original; q = 2 no se
  usa porque en SM-2 todo q < 3 reinicia).

Se eligió SM-2 sobre los otros candidatos:

- **Leitner (1970s):** simple, pero con cajas fijas no distingue dificultad
  por ficha; fue el algoritmo del prototipo v2 (ver *Decisiones*).
- **FSRS (Anki 2023+):** es el estándar moderno (modelo DSR que optimiza
  retención/esfuerzo), pero necesita un historial amplio por usuario para
  ajustar sus ~19 parámetros; queda anotado como mejora futura.
- **SM-2:** determinista, validado con décadas de uso y fácil de auditar y
  probar. Buena base para una app con contenido propio.

## Diseño (v3)

Escena de **escritorio de estudio diurno** (no una página blanca):

- **Libro de dos páginas:** pregunta a la izquierda, respuesta en tinta a la
  derecha (fuente Caveat) al revelarla.
- **Cintas** sobre el libro: cuatro marcadores que ahora representan **fases**
  derivadas del intervalo de cada ficha (Nuevas · Aprendiendo ≤ 6 d ·
  Repasando 7–20 d · Dominadas 21+ d).
- **Sellos de calificación** (Olvidé, Difícil, Bien, Fácil) con animación y
  sonido WebAudio (sin archivos).
- **Fichero de biblioteca:** cajón con la agenda de próximos repasos.
- **Notepad:** meta del día, racha y **periodo de estudio** con fecha objetivo.
- **Catálogo «Mis preguntas»:** listado con edición y borrado.
- Botón `Sonido: sí/no` en la cabecera.

## Estructura

```
spaced-repetition/
├── index.html              entrada (monta #root)
├── vite.config.ts          Vite + React plugin (puerto 3001)
├── vitest.config.ts        pruebas (entorno node)
├── tsconfig.json           TypeScript (strict, noEmit)
├── package.json            scripts: dev, test, lint, build, preview
├── src/
│   ├── main.tsx            arranque de React
│   ├── App.tsx             composición + sonidos de transición
│   ├── styles.css          escena de escritorio (libro, cintas, sellos)
│   ├── types.ts            modelos de datos (v3)
│   ├── lib/
│   │   ├── dates.ts        fechas en zona local
│   │   ├── scheduler.ts    SM-2 (EF, intervalos, fases)
│   │   ├── sound.ts        WebAudio
│   │   └── storage.ts      persistencia v3 + migración v1/v2
│   ├── state/
│   │   ├── reducer.ts      reducer puro (recibe `today` por acción)
│   │   ├── selectors.ts    cola, agenda, fases, meta
│   │   └── StoreContext.tsx provider + hooks
│   └── components/         Topbar, TodayStrip, Ribbons, ReviewBook,
│                           EmptyBook, Agenda, Notepad, CardForm, Catalog
├── src/tutorial/           tutorial guiado (Tour, engine, steps, demo)
└── tests/                  Vitest: dates, scheduler, storage, reducer, tutorial
```

## Pruebas

`npm run test` corre **67 pruebas** con Vitest sobre la lógica pura (fechas,
SM-2, persistencia y migración, reducer, tutorial), sin navegador. En los tests el
reducer recibe `today` por acción, así que son deterministas.

## Decisiones tomadas

- **Stack:** React 19 + Vite 8 + TypeScript 7 (strict) + Vitest, alineado a las
  versiones del repo `completo-learning-hub`. CSS propio (la escena es
  artesanal; Tailwind no aporta aquí).
- **Sin seed:** la app arranca vacía y no presta respuestas; el estudiante
  define sus preguntas y su fecha objetivo.
- **Algoritmo:** ~~Leitner~~ → **SM-2** (revisa *El método*). El Leitner fue una
  decisión provisional en v2; esta versión la sustituye con el algoritmo
  investigado. FSRS queda como mejora futura.
- **Persistencia v3** en `localStorage`, con migración automática desde v1 y
  v2 (las claves antiguas se conservan como respaldo y no se borran).
- **Fechas en zona local:** sin conversiones UTC.
- **Datos locales:** guarda en el navegador de cada dispositivo; no hay backend.
- **Relación con la app futura:** este apartado tendrá su propia escena dentro
  de la app general.

## Relación con los otros prototipos

- `completo-learning-hub/html/spaced/` — versión anterior (HTML vanilla).
- `completo-learning-hub/src/components/SpacedRepetitionPrototype.tsx` —
  versión React anterior (3 cajas, sin fechas).

## Pendientes

- **FSRS:** escalar el programador cuando exista historial de calificaciones
  para ajustar parámetros por usuario.
- **AI Studio (Gemini):** la API del proyecto sigue denegada (403); se usaría
  solo si se decide asistir el alta de fichas, respetando que la app no regala
  respuestas.
- **Mobile:** la escena ya es responsive; revisar la APK de `student`
  (Capacitor) cuando la app general integre este método.