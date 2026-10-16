# PomoStudy · Pomodoro (v0.3.0)

Temporizador Pomodoro en React + Vite. Parte de un port fiel de la app Android PomoStudy (Kotlin + Jetpack Compose) y le suma **cinco visiones** intercambiables, que comparten un mismo contrato de sesión, paletas de color, descansos configurables y un tutorial guiado. Es un solo proyecto responsive: celular, tablet y PC.

## Comandos

```bash
npm ci
npm run dev     # desarrollo
npm test        # lógica del contrato, del repositorio, de las visiones y del tutorial (node:test)
npm run build -- --base=/<ruta>/pomodoro/
```

## Qué hay

| Pieza | Dónde |
|---|---|
| Tema Material 3 (colores, escala tipográfica, componentes) | `src/theme.css`, `src/m3.css`, `src/m3.jsx` |
| Base local y reglas de perfiles, sesiones y bloques | `src/store.js` (en `localStorage`, clave `pomostudy_database.v1`) |
| Contrato de sesión común | `src/session/` |
| Alertas de sonido y vibración | `src/alerts.js` |
| App y pantallas (Configurar, temporizador, Estadísticas, perfil) | `src/App.jsx`, `src/screens/` |
| Componentes comunes y secciones plegables | `src/components/` |
| Visiones (capas de presentación) y su selector | `src/visions/`, `src/screens/VisionPickerDialog.jsx` |
| Paletas de la página principal | `src/palettes.js`, `src/components/PaletteCard.jsx` |
| Tutorial guiado | `src/tutorial/` |

## Contrato de sesión común

Vive en `src/session/contract.js`: módulo puro, sin DOM, sin reloj ni almacenamiento propios (el instante se recibe como argumento). `src/store.js` lo usa para toda la lógica de la sesión y solo añade base de datos, alertas y reloj.

| Pieza | Qué es |
|---|---|
| `createSession(config, ahora)` | Sesión nueva (bloque 1, enfoque, corriendo) con bloques y metas |
| `reduceSession(sesion, accion, ahora)` | Aplica una acción y devuelve `{ session, events }` sin mutar la entrada |
| Acciones (`ActionType`) | `tick`, `togglePlay`, `pause`, `resume`, `addMinutes`, `toggleBlock`, `completeCurrent`, `skipPhase`, `restartPhase`, `finish` |
| Eventos (`EventKind`) | `alert` (clave de alerta del APK) y `haptic`; cada visión decide cómo mostrarlos |
| `extractSession(sesion)` | Resultado: tema, bloques, segundos de enfoque y descanso, tasa de cumplimiento |
| `toSavedRecord(sesion, ...)` | Registro guardable `{ session, blocks }`. **No incluye la visión usada** |
| `fromSavedRecord(registro, bloques)` | Sesión terminada, de solo lectura, para reabrirla con cualquier visión |

## Visiones

Al pulsar «Iniciar» (pestaña Configurar) se abre un selector accesible (`role="dialog"`, foco atrapado, Escape cierra, flechas mueven entre opciones). La visión elegida vive solo en memoria y no se guarda con la sesión, así que cualquier sesión se puede reabrir con cualquiera.

| Visión | Idea |
|---|---|
| Pomodoro | Reloj con arco, atajos de teclado y modo enfoque |
| Calma | Planear la tarde: módulos, descansos y hora de término |
| Visión | Mapa de ruta de fichas con la ficha actual abierta |
| Paridad | La presentación base, copia fiel de la app Android |
| Investigación | Perfiles de partida (Libre, Guiado, Estructurado) y ajustes de avisos y pantalla |

Cada visión tiene un botón **Colores** con el tema (del dispositivo, claro u oscuro) y las paletas que sugiere; esas paletas solo afectan a su propia visión.

## Paletas de la página principal

En Configurar hay un selector de paleta que se combina con claro/oscuro: Original, Salvia y nogal, Océano y coral, y Ciruela y menta. Las pruebas exigen contraste 4,5:1 en texto y 3:1 en elementos gráficos para cada paleta y modo.

## Descansos y plegables

- `longBreakEvery` define cada cuántos bloques hay descanso largo (0 = nunca; por defecto 4). Un descanso de 0 min equivale a no tenerlo. Los registros guardados antes de este campo se leen con 4.
- Arriba de los controles de tiempo se ven las horas de estudio y las totales, que cambian al mover cualquier control.
- Sonido y vibración, y la paleta, son tarjetas plegables.

## Reabrir una sesión guardada

En Estadísticas, cada sesión del historial tiene **Ver con una visión**: abre el selector y muestra la sesión en **solo lectura** (sin reloj, sin diálogo de resumen y sin cambiar el registro). Si hay una sesión en curso, el botón queda desactivado.

## Almacenamiento

Todo se guarda en `localStorage` del navegador, con `try/catch`; si falla, la app funciona sin recordar nada.

| Qué | Clave |
|---|---|
| Perfiles, sesiones y bloques | `pomostudy_database.v1` |
| Tutorial visto | `kairos_pomodoro_tutorial_v1` |
| Paleta de la página principal | `kairos_pomodoro_palette_v1` |
| Paleta de cada visión | `kairos_pomodoro_vision_<visión>_palette_v1` |
| Ajustes de Investigación | `kairos_pomodoro_vision_investigacion_v1` |

El estado de la configuración, la sesión en curso y las preferencias (sonido, vibración, tema) vive en memoria y se reinicia al recargar, igual que en el APK.

## Cambios que impone la plataforma

- **Base de datos:** Room → `localStorage` (mismas tablas: perfiles, sesiones y bloques).
- **Sonido:** `alerts.js` sintetiza tonos de la misma duración y secuencia que el APK (aproximados).
- **Vibración:** mismos patrones con `navigator.vibrate` (solo Android/Chrome; sin amplitudes).
- **Pantalla:** responsive por ancho. En celular (menos de 640 px) una columna de hasta 480 px con barra inferior; en tablet (640–899 px) la columna crece hasta 760 px y pasa a 2 columnas; en PC (desde 900 px) la barra inferior es un riel lateral y el contenido ocupa hasta 1120 px en 2 columnas.
- **Tipografía:** Roboto (variable) con `@fontsource-variable/roboto`.

## Tutorial

La primera vez, un recorrido guiado de 18 pasos oscurece la pantalla y resalta cada parte. Cambia de pestaña por ti y usa una sesión de muestra, solo en memoria, que descarta al terminar. Siempre tiene «Saltar tutorial», se cierra con Escape y se repite con el botón «?» (Ayuda). Los elementos resaltados se marcan con `data-tour="..."`.

## Accesibilidad

Auditoría con navegador real en 11 tamaños de pantalla (de 320×568 a 2560×1300), en claro y oscuro: sin scroll horizontal, sin elementos fuera de pantalla y sin controles menores de 24×24 px; `axe-core` (WCAG 2.2 AA) sin hallazgos de etiquetas, regiones, foco ni teclado.

**Límite conocido (paleta «Original»):** la app base hereda colores fijos del APK (rojo `#D9483B`, verde `#10B981`, azul `#0284C7`) que dan entre 2,1:1 y 4,4:1 en algunos textos pequeños. No se cambiaron para conservar la fidelidad con el APK; las demás paletas mejoran la mayoría de esos casos.

## Rarezas del APK conservadas

La meta por defecto es 100 min en el resumen semanal y 120 en el diálogo de meta; las etiquetas de semana salen como `-1s`, `-2s`; `Meta: 1.6666666h/día` usa `Float.toString`; la pantalla de estadísticas no muestra los bloques de cada sesión.

## Qué falta comprobar

La fidelidad visual de Paridad se revisó contra el código Kotlin y contra la web de referencia, no contra pantallas reales del APK. Conviene compararla lado a lado con un emulador o dispositivo.
