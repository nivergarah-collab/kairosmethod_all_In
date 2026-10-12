# PomoStudy · paridad con el APK (v0.1.0)

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

## Comandos

```bash
npm ci
npm run dev     # desarrollo
npm test        # lógica del temporizador y del repositorio (node:test)
npm run build -- --base=/<ruta>/pomodoro/
```

## Cambios que impone la plataforma (los únicos)

- **Base de datos:** Room → `localStorage` (mismas tablas: perfiles, sesiones y bloques). Igual que en el APK, el estado de la configuración, la sesión en curso y las preferencias (sonido, vibración, tema) vive en memoria y se reinicia al recargar.
- **Sonido:** el APK reproduce el tono de notificación del sistema y `ToneGenerator`; la web no tiene ese sonido, así que `alerts.js` sintetiza tonos de la misma duración y secuencia (aproximados).
- **Vibración:** mismos patrones, con `navigator.vibrate` (solo funciona en Android/Chrome; sin amplitudes).
- **Pantalla:** el teléfono se muestra como una columna de hasta 480 px centrada. Sin barra de estado ni botón Atrás del sistema.
- **Tipografía:** Roboto (variable) incluida con `@fontsource-variable/roboto`; el APK usa la fuente por defecto del sistema (Roboto en Android).

## Rarezas del APK copiadas tal cual

Se mantienen aunque parezcan errores, para que la paridad sea exacta: la meta por defecto es 100 min en el resumen semanal y 120 en el diálogo de meta; las etiquetas de semana salen como `-1s`, `-2s`; `Meta: 1.6666666h/día` usa `Float.toString`; la pantalla de estadísticas no muestra los bloques de cada sesión; el descanso largo ocurre cuando el índice del bloque es múltiplo de 4 y no es el último.

## Qué falta comprobar

No hay capturas del APK en ejecución en el repositorio: la fidelidad visual se revisó contra el código Kotlin, no contra pantallas reales. Conviene comparar lado a lado con un emulador o dispositivo.
