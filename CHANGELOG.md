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
- Este `CHANGELOG.md`.

### Cambiado
- Modelo responsive (07-oct): cada app es un solo proyecto React que se adapta a PC y celular; el apk de `student` sale del mismo código con Capacitor (web empaquetada). Se quitaron las subcarpetas `web/` y `mobile/` de los prototipos y de `apps/student/`; `apps/teacher/` conserva `web/` y `mobile/` por confirmar.
- `docs/mobile.md` describe el modelo responsive + Capacitor como destino aún no implementado. Actualizados `docs/estructura.md`, `docs/despliegue.md`, `docs/decisiones.md`, `README.md`, `CONTRIBUTING.md` y los README de `apps/`.
- Pages queda preparado, pero no despliega hasta que el portal y los prototipos base estén construidos y enlazados. CI, build Android y publicación Docker no se activan hasta que exista una tarea real que ejecutar.
- KAN-24: las skills de agentes quedan fuera del repo online (`skills/` en `.gitignore`); `AGENTS.md` incluye las reglas esenciales y funciona con o sin esa carpeta.
- Se quitó el tipo de rama `skills` de la convención de ramas.
- Distribución vigente de skills: su fuente es `allinchile-anexos/skills/` y Notion mantiene un espejo; ya no se usan ZIP ni pendrives.
- Flujo de trabajo definido: una rama por tarea o proyecto (`<tipo>/kan-<n>-<descripcion>`), Pull Request con revisión por pares de palabra, verificación manual mientras no haya CI útil y merge con squash. `main` se protegerá al crear el repo. Ver `CONTRIBUTING.md`.

### Retirado
- Antes de iniciar el repo público: workflows sin función ejecutable (CI vacío, build Android aún no implementado y publicación Docker sin backend) y `.github/CODEOWNERS` de ejemplo. Se conservan las plantillas de PR/issues y el workflow protegido de Pages.
