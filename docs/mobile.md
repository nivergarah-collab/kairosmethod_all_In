# Interfaz responsive y apk con Capacitor

**Estado:** modelo objetivo decidido el 07-oct-2026 (reemplaza la "regla de dos capas" y las apps móviles nativas independientes). `student/`, Capacitor y el workflow Android aún no están implementados; este documento describe la dirección futura.

## Modelo

- Cada app es **un solo proyecto React** con diseño **responsive por tamaño de pantalla**: los mismos componentes se reorganizan según el ancho. No hay un parámetro de plataforma ni un código aparte para celular.
- El **apk de Android** se genera del mismo proyecto con **Capacitor**: se construye la web y su resultado se **empaqueta dentro del apk** (no abre la web publicada en internet).
- Así, web y apk comparten todo el código de interfaz.

## A quién aplica

| Zona | Modelo | Apk |
|---|---|---|
| `apps/student/` | Un proyecto responsive; de él salen web y apk | Sí, con Capacitor |
| `apps/prototypes/<método>/` | Un proyecto responsive por método; solo web | No |
| `apps/teacher/` | **Por confirmar**: la web y la app de celular serían cosas diferentes (`web/` y `mobile/` separadas) | Sí, futuro; no se trabaja en esta fase |

## Cómo se construye el apk de `student`

1. `npm run build -- --base=./` genera la web con rutas relativas (necesario dentro del apk; para GitHub Pages se usa otro `--base`).
2. `npx cap sync android` copia el build al proyecto Android de la carpeta `apps/student/android/`.
3. `./gradlew assembleDebug` (dentro de `android/`) produce el apk debug.

Cuando se implemente `student/` y se configure Capacitor, estos pasos podrán automatizarse. Hoy no hay workflow Android ni artefacto de apk.

## Pendiente

- Crear el proyecto de `student` y agregar Capacitor (`npx cap add android`).
- Definir los puntos de quiebre del diseño responsive.
- Definir si funciones propias del celular (notificaciones, uso sin conexión) piden plugins de Capacitor.
- Confirmar la estructura de `apps/teacher/` antes de trabajar en ella.
