# Repository Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar `kairosmethod` como repositorio público y colaborativo con documentación coherente, automatizaciones ajustadas a la etapa y Pages protegido contra publicaciones incompletas.

**Architecture:** Mantener el esqueleto y sus README, retirar workflows sin una tarea ejecutable y hacer que el build de Pages falle antes de publicar si falta el portal o cualquiera de los prototipos funcionales que deban aparecer enlazados. Sin inicializar Git ni crear código de producto.

**Tech Stack:** Markdown, GitHub Actions YAML, Bash; sincronización documental con Notion.

**Spec:** `docs/superpowers/specs/2026-10-08-repository-cleanup-design.md`

## Global Constraints

- `kairosmethod` será público, con colaboradores, sin organización y sin archivo de licencia.
- Se conservan las carpetas previstas y sus README; no se crea el portal ni código de prototipo en esta tarea.
- Pages se habilita para publicar cuando el portal mínimo y todos los prototipos base seleccionados para la primera publicación estén listos y enlazados.
- Docker queda sin workflow activo hasta que existan backend, Dockerfile y destino de publicación definido.
- La persistencia local de Kaizen no implica backend ni sincronización entre dispositivos.
- No inicializar Git ni hacer commit o push.

## Review Focus

- Portal ausente o sin `index.html`: el build debe fallar antes de crear un artefacto desplegable.
- Prototipo funcional ausente, con build incompleto o no enlazado desde el portal: Pages debe fallar y no desplegar.
- Plantillas vacías de prototipos: deben seguir siendo scaffolds y no bloquear por sí solas el build de los prototipos seleccionados.
- Repositorio público sin licencia: documentación no debe implicar que el código tiene licencia de reutilización.
- Ausencia de conectores Jira/Confluence: no afirmar que esos sistemas fueron actualizados.

---

### Task 1: Guardas de build y despliegue de Pages

**Files:**
- Modify: `infra/scripts/build-site.sh`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `docs/despliegue.md`
- Modify: `docs/estructura.md`

**Interfaces:**
- El workflow recibe `REQUIRED_PROTOTYPES` desde la variable de Actions `PAGES_REQUIRED_PROTOTYPES`; omite los jobs mientras esa variable no esté configurada.
- El script construye el portal en `dist/` y exactamente los prototipos enumerados en `REQUIRED_PROTOTYPES`, bajo `dist/prototypes/<nombre>/`.

- [x] **Step 1: Añadir precondiciones de publicación**
  El script exige portal, lista explícita `REQUIRED_PROTOTYPES` y `package.json` para cada prototipo elegido antes de limpiar la salida; exige que cada build produzca `dist/index.html`.
- [x] **Step 2: Verificar enlaces del portal**
  El HTML debe tener un atributo `href` (comilla simple o doble) que comience con `BASE_PATH/prototypes/<nombre>/`, incluyendo la base de proyecto Pages; una aparición como texto no basta.
- [x] **Step 3: Endurecer el workflow**
  Los jobs quedan omitidos hasta configurar `PAGES_REQUIRED_PROTOTYPES`; `build` y `deploy` solo se ejecutan cuando el build completa. El filtro observa código, manifiestos, recursos, script y workflow, no README.
- [x] **Step 4: Probar los casos de fallo y el caso válido**
  `bash -n` y parseo YAML pasaron. Fixtures temporales verificaron portal faltante, lista vacía, prototipo seleccionado faltante, ruta sin enlace/solo `data-href`, enlace con base incorrecta y build válido con href enlazado a la base correcta, tanto para un prototipo como para selección múltiple.
- [x] **Step 5: Actualizar las instrucciones de Pages**
  La documentación indica configurar `PAGES_REQUIRED_PROTOTYPES` después de crear el repo, no ejecutar Pages durante esta preparación y usar `workflow_dispatch` cuando el sitio esté listo.

### Task 2: Retirar automatizaciones y propiedad de ejemplo sin uso

**Files:**
- Delete: `.github/workflows/ci.yml`
- Delete: `.github/workflows/build-android.yml`
- Delete: `.github/workflows/docker-publish.yml`
- Delete: `.github/CODEOWNERS`
- Modify: `infra/docker/README.md`
- Modify: `infra/README.md`

- [x] **Step 1: Retirar los cuatro archivos aprobados**
  Quitar solo esos workflows y el `CODEOWNERS` de ejemplo; conservar las plantillas PR/issues y el workflow protegido de Pages.
- [x] **Step 2: Alinear la documentación de infraestructura**
  Dejar claro que Docker es una carpeta reservada para una fase futura y que no existe un workflow de publicación activo.
- [x] **Step 3: Verificar el inventario**
  Confirmar que los workflows CI, Android y Docker retirados no existen, que el de Pages sí existe y que las plantillas siguen presentes.

### Task 3: Alinear documentos del repositorio y su changelog

**Files:**
- Modify: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `AGENTS.md`
- Modify: `docs/decisiones.md`, `docs/despliegue.md`, `docs/estructura.md`, `docs/mobile.md`
- Modify: `apps/README.md`, `apps/prototypes/README.md`
- Modify: `apps/prototypes/kaizen/README.md`, `apps/prototypes/montessori/README.md`, `apps/prototypes/pomodoro/README.md`
- Modify: `apps/student/README.md`

- [x] **Step 1: Limpiar el README raíz**
  Quitar enlaces internos a Notion y Jira; reflejar repo público con colaboradores, sin organización ni licencia; presentar los workflows como preparación y no como despliegues activos.
- [x] **Step 2: Corregir decisiones y arquitectura**
  Reemplazar la decisión de organización pendiente, precisar el límite entre frontend y backend y permitir persistencia local solo donde el prototipo lo requiera; conservar la estructura prevista.
- [x] **Step 3: Alinear README de apps y prototipos**
  Quitar la afirmación general de “sin persistencia” donde contradiga la decisión de Kaizen; explicar en Kaizen que cualquier almacenamiento local es solo del dispositivo y no necesita backend. Mantener las demás apps sin persistencia si así está decidido.
- [x] **Step 4: Corregir referencias móviles prematuras**
  Actualizar `docs/mobile.md`, `apps/student/README.md` y `README.md` para que describan Capacitor como decisión futura y no prometan un workflow/apk automático mientras la app y su configuración no existan.
- [x] **Step 5: Corregir el changelog**
  Ajustar la sección “Sin publicar” para que no presente como operativos los workflows retirados; registrar la limpieza de workflows y los guardas de Pages.
- [x] **Step 6: Buscar contradicciones**
  Buscar referencias a organización pendiente, links internos del README, Pages como activo, workflows retirados como existentes y la afirmación global de que nada persiste; resolver las encontradas dentro del alcance aprobado.

### Task 4: Sincronizar decisiones y trabajo pendiente en Notion

**Files:**
- External: páginas WIP, Riesgos y Decisiones, tech-stack y arquitectura del espacio Notion del proyecto.
- Audit only: `allinchile-anexos/skills/core/tech-stack/SKILL.md`, `allinchile-anexos/skills/core/architecture/SKILL.md`, `allinchile-anexos/skills/core/repo-boundary/SKILL.md`.

- [x] **Step 1: Volver a consultar las páginas antes de editarlas**
  Recuperar contenido y propiedades actuales de las páginas pertinentes para evitar reemplazar actualizaciones recientes.
- [x] **Step 2: Actualizar decisiones y secuencia**
  Registrar repo público sin organización ni licencia; marcar Git init/primer push como pendiente del usuario; dejar Pages como siguiente entrega tras crear/enlazar el repo y disponer del portal y prototipos base; Docker y workflows retirados quedan futuros/no activos.
- [x] **Step 3: Actualizar el WIP**
  Corregir la tarea de preparación del repo/despliegue para que no solicite crear una organización y refleje la secuencia acordada.
- [x] **Step 4: Verificar páginas modificadas**
  Volver a consultarlas y comprobar que no se alteraron otras decisiones. Registrar Jira/Confluence como no actualizados porque no hay conectores disponibles.
- [x] **Step 5: Preservar la rama de skills existente**
  Auditar si las skills fuente contienen contradicciones; el checkout `allinchile-anexos` está en `skills/repo-boundary-private-name-permission` con cambios locales en `repo-boundary`. No modificar esa skill ni cambiar de rama durante esta tarea; registrar cualquier corrección requerida como pendiente separada.

### Task 5: Verificación integral y entrega

**Files:**
- Verify: archivos modificados en Tasks 1–4.

- [x] **Step 1: Ejecutar las verificaciones de aceptación**
  Comprobar README sin enlaces internos, estructura conservada, workflows retirados/Pages retenido, guardas funcionales, documentación consistente y ausencia de licencia/organización afirmadas incorrectamente.
- [x] **Step 2: Revisar el alcance externo**
  Confirmar los cambios de Notion y declarar explícitamente Jira/Confluence pendientes si continúan sin conector.
- [x] **Step 3: Confirmar límites de Git**
  Verificar que la carpeta sigue sin `.git`; no inicializar, hacer commit ni push.
- [x] **Step 4: Revisión independiente**
  Revisar el estado actual en lectura; los hallazgos importantes del primer pase se corrigieron y la revisión final no encontró hallazgos importantes nuevos. No hay diff Git porque el repo aún no está inicializado.

