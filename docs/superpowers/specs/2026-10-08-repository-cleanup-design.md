# Diseño: preparación del repositorio y limpieza de automatizaciones

**Estado:** diseño para revisión de Nicolás  
**Fecha:** 2026-10-08

## Objetivo

Dejar `kairosmethod` como un repositorio público y colaborativo, con una estructura útil y documentación coherente, sin automatizaciones que no puedan cumplir todavía su función. El repo de anexos se mantiene como el único privado.

## Decisiones acordadas

- `kairosmethod` será público y tendrá colaboradores. No se creará una organización.
- No se añadirá un archivo de licencia. La visibilidad pública, por sí sola, no concede permiso explícito para reutilizar el código.
- Se conservan las carpetas previstas y sus README; se retiran los componentes operativos prematuros, no el mapa del producto.
- GitHub Pages tendrá prioridad cercana: después de crear y enlazar el repo, y de disponer de un portal mínimo conectado a los prototipos base, se publicará una página funcional.
- Docker no se activa ni se reemplaza por otro mecanismo ahora. Su publicación se reevalúa cuando exista el backend y estén definidos la imagen y su destino.
- La persistencia local del prototipo Kaizen no implica backend ni persistencia compartida entre dispositivos.

## Limpieza propuesta

### Conservar

- La estructura de directorios y los README que la describen.
- Plantillas de Pull Request e issues, `.gitignore`, `.gitattributes`, `.editorconfig`, `AGENTS.md`, `CLAUDE.md` y guías de colaboración.
- `infra/scripts/build-site.sh` y `.github/workflows/deploy-pages.yml`, ajustados para que no publiquen una salida vacía. Antes de desplegar, el flujo debe comprobar que existe una página de portal construible y que están presentes y enlazados los prototipos base seleccionados para esa primera publicación; si falta alguna condición, debe detenerse sin publicar.
- La nota de futuro de Docker en documentación, sin un workflow activo.

### Retirar

- `.github/workflows/ci.yml`: hoy no ejecuta pruebas ni builds útiles para el esqueleto actual.
- `.github/workflows/build-android.yml`: aún no existe la app de estudiante ni el proyecto Capacitor.
- `.github/workflows/docker-publish.yml`: el backend y el Dockerfile todavía no existen.
- `.github/CODEOWNERS`: solo contiene ejemplos y no asigna responsables reales.

### Ajustar

- Eliminar del README los enlaces internos a Notion y Jira.
- Actualizar la decisión antigua de “repo público + organización pendiente” para registrar el repo público sin organización ni licencia.
- Mantener Pages como trabajo próximo condicionado a repo enlazado, portal mínimo y prototipos base seleccionados y conectados; no describirlo como despliegue ya operativo antes de cumplir esas condiciones.
- Documentar Docker como “sin workflow por ahora”; volver a habilitar publicación cuando existan backend, Dockerfile y destino de publicación definido.
- Aclarar en arquitectura y README de prototipos que “sin backend” no prohíbe almacenamiento local, y limitar esa excepción al prototipo que lo requiera.
- Alinear `CHANGELOG.md` con los archivos que realmente quedarán en el primer estado del repo.

## Repercusiones a sincronizar

- Documentación local del proyecto: `README.md`, `AGENTS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `docs/decisiones.md`, `docs/despliegue.md`, `docs/estructura.md`, `apps/README.md`, los README de prototipos e `infra/docker/README.md`.
- Skills privadas y sus espejos de Notion que describen la frontera entre repos, el stack, la arquitectura y los workflows de GitHub.
- WIP y registro de decisiones de Notion: retirar la organización como pendiente y precisar la secuencia de Pages.
- Jira/Confluence: no hay conectores disponibles en esta sesión; no se asumirá que esas referencias quedan actualizadas.

## Fuera de alcance

- Inicializar Git en la carpeta, crear el repo remoto, configurar colaboradores o cambiar reglas de ramas.
- Elegir los prototipos definitivos o importar su código.
- Crear ahora el portal o los prototipos base. Solo se dejará Pages protegido para que el siguiente trabajo pueda publicar un sitio mínimo.
- Implementar backend, base de datos o publicación Docker.

## Criterios de aceptación

1. La carpeta conserva su mapa de producto y no tiene enlaces internos de Notion/Jira en el README.
2. El repo sigue declarando visibilidad pública, sin organización ni archivo de licencia; el anexo sigue siendo el único privado.
3. Pages no puede reemplazar el sitio con una salida vacía y se activa cuando el portal mínimo y todos los prototipos base seleccionados para esa primera publicación están listos y enlazados.
4. No quedan workflows CI, Android o Docker que no puedan ejecutar una tarea real en esta etapa.
5. Los documentos no contradicen la secuencia de despliegue ni la persistencia local acotada de Kaizen.
6. Las decisiones e instrucciones aplicables quedan reflejadas en Notion; cualquier actualización externa sin conector se deja identificada como pendiente.
7. No se inicializa Git ni se hace commit o push durante esta preparación.
