# PomoStudy · paridad con el APK (v0.2.0)

Copia fiel, en React + Vite, de la app Android PomoStudy (Kotlin + Jetpack Compose). Se portó archivo por archivo, sin cambios estéticos: mismas pantallas, textos, colores (`Color.kt`, `Theme.kt`), tipografía de Material 3 (material3 1.3.0), medidas en dp = px y la misma lógica del `MainViewModel`.

## Qué hay

| Android | Web |
|---|---|
| `ui/theme/*` | `src/theme.css` (colores y escala tipográfica), `src/m3.css`, `src/m3.jsx` (componentes Material 3 usados) |
| `MainViewModel` + `StudyRepository` + Room | `src/store.js` (mismas acciones y reglas; base en `localStorage`, clave `pomostudy_database.v1`) |
| `NotificationAlertManager` | `src/alerts.js` |
| `MainActivity` (Scaffold + NavigationBar) | `src/App.jsx`, `src/app.css` |
| `ui/session/*` | `src/screens/SessionConfigScreen.jsx`, `ActiveTimerScreen.jsx`, `SessionSummaryDialog.jsx` |
| `ui/stats/StatsScreen` | `src/screens/StatsScreen.jsx` |
| `ui/user/UserManagementDialog` | `src/screens/UserManagementDialog.jsx` |
| `ui/components/*` | `src/components/CommonComponents.jsx`, `DailyGoalComponents.jsx`, `WeeklyStudyChart.jsx` |
| (solo web) tutorial guiado | `src/tutorial/` (ver «Tutorial») |

## Comandos

```bash
npm ci
npm run dev     # desarrollo
npm test        # lógica del temporizador, del repositorio y del tutorial (node:test)
npm run build -- --base=/<ruta>/pomodoro/
```

## Cambios que impone la plataforma (los únicos)

- **Base de datos:** Room → `localStorage` (mismas tablas: perfiles, sesiones y bloques). Igual que en el APK, el estado de la configuración, la sesión en curso y las preferencias (sonido, vibración, tema) vive en memoria y se reinicia al recargar.
- **Sonido:** el APK reproduce el tono de notificación del sistema y `ToneGenerator`; la web no tiene ese sonido, así que `alerts.js` sintetiza tonos de la misma duración y secuencia (aproximados).
- **Vibración:** mismos patrones, con `navigator.vibrate` (solo funciona en Android/Chrome; sin amplitudes).
- **Pantalla:** diseño responsive por ancho, en un solo proyecto (sin código de interfaz duplicado). En celular (menos de 640 px) se ve igual que el APK: una columna de hasta 480 px centrada con barra inferior. En tablet (640–899 px) la columna crece hasta 760 px y las pantallas pasan a 2 columnas. En PC (desde 900 px) la barra inferior se vuelve un riel lateral (compacto hasta 1099 px, con etiquetas desde 1100 px) y el contenido ocupa hasta 1120 px en 2 columnas. Colores, tipografía y reglas no cambian. Sin barra de estado ni botón Atrás del sistema.
- **Tipografía:** Roboto (variable) incluida con `@fontsource-variable/roboto`; el APK usa la fuente por defecto del sistema (Roboto en Android).

## Tutorial

La primera vez que se entra, un recorrido guiado de 18 pasos oscurece la pantalla y resalta cada parte: perfil y meta, plantillas, tema, bloques y descansos, alertas, objetivo por bloque, iniciar sesión, temporizador y sus controles, progreso de bloques, estadísticas e historial. Cambia de pestaña por ti; para mostrar el temporizador usa una sesión de muestra, solo en memoria, que descarta al terminar (no se guarda nada). Siempre tiene «Saltar tutorial», se cierra con Escape y se repite con el botón «?» (Ayuda) de la barra de navegación.

- Recuerda en `localStorage` (clave `kairos_pomodoro_tutorial_v1`, con `try/catch`) si se vio o se saltó; si el almacenamiento falla, la app funciona y el tutorial se abre en cada carga.
- Los elementos resaltados se marcan con `data-tour="..."`. La lógica pura (pasos, avance, persistencia, posición de la tarjeta y plan de vistas) está en `src/tutorial/*.js` con sus pruebas.

## Rarezas del APK copiadas tal cual

Se mantienen aunque parezcan errores, para que la paridad sea exacta: la meta por defecto es 100 min en el resumen semanal y 120 en el diálogo de meta; las etiquetas de semana salen como `-1s`, `-2s`; `Meta: 1.6666666h/día` usa `Float.toString`; la pantalla de estadísticas no muestra los bloques de cada sesión; el descanso largo ocurre cuando el índice del bloque es múltiplo de 4 y no es el último.

## Qué falta comprobar

No hay capturas del APK en ejecución en el repositorio: la fidelidad visual se revisó contra el código Kotlin, no contra pantallas reales. Conviene comparar lado a lado con un emulador o dispositivo.
