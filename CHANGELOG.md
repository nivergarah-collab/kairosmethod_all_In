# Changelog

Cambios del **repositorio** (código, infraestructura y documentación). Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Cada Pull Request agrega su línea bajo "Sin publicar".

El changelog del espacio de trabajo (Notion, Jira, Confluence) es otro: 📜 CHANGELOG en Notion. Los cambios relevantes de este archivo se reflejan allí (ver `dev/repo-changelog` en `allinchile-anexos/skills/`).

## Sin publicar

### Agregado
- KAN-25: esqueleto del monorepo: carpetas por prototipo (pomodoro, montessori, kaizen), `apps/student`, `apps/teacher`, `web/portal`, `services/backend`, `db` e `infra`, cada una con su README.
- KAN-25: workflow de GitHub Pages protegido contra salidas incompletas y `infra/scripts/build-site.sh`; plantillas de Pull Request e issues, `.gitignore`, `.gitattributes` y `.editorconfig`.
- KAN-25: documentación en `docs/`: estructura, apps móviles (regla de dos capas), despliegue y registro de decisiones.
- KAN-24: `AGENTS.md` como punto de entrada único para cualquier agente de IA (`CLAUDE.md` lo importa); remite a las skills locales si existen.
- KAN-14: portal mínimo en `web/portal` (React + Vite): lista los métodos de estudio; Montessori enlaza a su prototipo y Pomodoro, Kaizen y «Por definir» aparecen como «Próximamente». Lista en `src/methods.js` con pruebas.
- KAN-14: prototipo Montessori (v0.5.13) en `apps/prototypes/montessori`: ambiente de estudio responsive con escritorio, bandeja, sesión con cronómetro, herramientas y guardado local. Incluye 54 pruebas de lógica.
- KAN-15: prototipo Pomodoro (v0.1.0) en `apps/prototypes/pomodoro`: réplica web de la app PomoStudy, con 9 pruebas de lógica.
- KAN-16: prototipo Kaizen (v0.1.0) en `apps/prototypes/kaizen`: jardín de hábitos con escena y plantas movibles, guardado local y 70 pruebas.
- Prototipo Repetición Espaciada (v3.0.0) en `apps/prototypes/spaced` (React 19 + TypeScript, algoritmo SM-2, agenda y 49 pruebas). Autoría: ST-opc.
- KAN-15: tutorial guiado en Pomodoro (v0.2.0): recorrido de 18 pasos que se abre solo la primera vez, resalta cada parte de la app, cambia de pestaña por la persona usuaria y se repite con el botón «?» (Ayuda) de la barra de navegación. Para mostrar el temporizador usa una sesión de muestra en memoria; no guarda datos de ejemplo.
- KAN-14: tutorial guiado en Montessori (v0.6.0): recorrido de 9 o 10 pasos sobre el escritorio, la bandeja, los controles de cada elemento, el cronómetro, el fondo, los ejemplos, los datos, las herramientas y el inicio de sesión, con botón «?» en la barra superior. Sin cambios en su lógica ni en sus pruebas.
- KAN-16: tutorial guiado en Kaizen (v0.2.0): recorrido de 14 pasos por el jardín, las plantas, el cuidado diario, el Vivero, el Herbario y los Ajustes, con plantas de ejemplo solo en memoria y botón «?». (Repetición Espaciada y Kaizen comparten el ticket KAN-16.)
- KAN-16: tutorial guiado en Repetición Espaciada (v3.1.0): recorrido de 9 pasos por las fichas, las cintas, el libro de repaso, los sellos, la agenda, el catálogo, la meta y el sonido, con fichas de ejemplo solo en memoria y botón «?». Este prototipo no tiene ticket propio.
- Cada tutorial recuerda en `localStorage` (clave `kairos_<prototipo>_tutorial_v1`, con `try/catch`) si se vio o se saltó, y cada prototipo lleva su propia implementación (no se importa código entre carpetas de `apps/`).
- Este `CHANGELOG.md`.

### Cambiado
- KAN-15: Pomodoro (v0.3.0) reemplaza el código de la v0.2.0 por la versión consolidada: cinco visiones (Pomodoro, Calma, Visión, Paridad e Investigación) que comparten un contrato de sesión común, selector de visión al iniciar, paletas de la página principal y colores propios por visión, descansos configurables (`longBreakEvery`; 0 = nunca) con horas de estudio y totales, secciones plegables, perfiles y temas del usuario, y «Ver con una visión» para reabrir una sesión guardada en solo lectura. Mantiene las claves de `localStorage` de la v0.2.0 (`pomostudy_database.v1` y `kairos_pomodoro_tutorial_v1`), así que el historial existente se conserva; los nombres de perfil antiguos se normalizan a 50 caracteres al cargar. 144 pruebas de lógica. Reescrito `apps/prototypes/pomodoro/README.md`; actualizado `apps/prototypes/README.md`.
- KAN-15: Pomodoro (v0.2.0) deja de ser solo una columna de celular de 480 px: es responsivo por ancho de pantalla en un solo proyecto. En celular (menos de 640 px) se ve igual que antes; en tablet (640–899 px) usa una columna de hasta 760 px en 2 columnas; en PC (desde 900 px) usa un riel de navegación lateral y contenido de hasta 1120 px en 2 columnas. Sin cambios en la lógica del temporizador ni en el almacenamiento.
- El portal habilita Pomodoro, Kaizen y Repetición Espaciada junto a Montessori; «Por definir» sigue como «Próximamente». Actualizados `web/portal/README.md`, `README.md`, `apps/prototypes/README.md`, `docs/despliegue.md`, `docs/decisiones.md` y `docs/estructura.md`.
- Modelo responsive (07-oct): cada app es un solo proyecto React que se adapta a PC y celular; el apk de `student` sale del mismo código con Capacitor (web empaquetada). Se quitaron las subcarpetas `web/` y `mobile/` de los prototipos y de `apps/student/`; `apps/teacher/` conserva `web/` y `mobile/` por confirmar.
- `docs/mobile.md` describe el modelo responsive + Capacitor como destino aún no implementado. Actualizados `docs/estructura.md`, `docs/despliegue.md`, `docs/decisiones.md`, `README.md`, `CONTRIBUTING.md` y los README de `apps/`.
- Pages queda preparado, pero no despliega hasta que el portal y los prototipos base estén construidos y enlazados. CI, build Android y publicación Docker no se activan hasta que exista una tarea real que ejecutar.
- KAN-24: las skills de agentes quedan fuera del repo online (`skills/` en `.gitignore`); `AGENTS.md` incluye las reglas esenciales y funciona con o sin esa carpeta.
- Se quitó el tipo de rama `skills` de la convención de ramas.
- Distribución vigente de skills: su fuente es `allinchile-anexos/skills/` y Notion mantiene un espejo; ya no se usan ZIP ni pendrives.
- Flujo de trabajo definido: una rama por tarea o proyecto (`<tipo>/kan-<n>-<descripcion>`), Pull Request con revisión por pares de palabra, verificación manual mientras no haya CI útil y merge con squash. `main` se protegerá al crear el repo. Ver `CONTRIBUTING.md`.

### Retirado
- Antes de iniciar el repo público: workflows sin función ejecutable (CI vacío, build Android aún no implementado y publicación Docker sin backend) y `.github/CODEOWNERS` de ejemplo. Se conservan las plantillas de PR/issues y el workflow protegido de Pages.
