# KairosMethod

Espacio de estudio multiplataforma (PC + celular) para enseñanza media, basado en métodos de estudio validados (Pomodoro, Montessori, Kaizen, SQ3R, Repetición Espaciada). Proyecto para **All in Chile 2026**.

Este monorepo contendrá tanto **prototipos aislados** como el **proyecto final** que los irá integrando. El modelo previsto es una app React responsive por producto; el apk de Android con Capacitor es futuro y todavía no está implementado (ver [docs/mobile.md](docs/mobile.md)).

El repositorio será **público y colaborativo**, sin organización de GitHub ni archivo de licencia. La visibilidad pública no concede por sí sola permiso explícito para reutilizar el código.

## Estructura

| Carpeta | Contenido | Estado |
|---|---|---|
| `apps/prototypes/<método>` | Prototipos aislados (pomodoro, montessori, kaizen): un proyecto React responsive cada uno, solo web | Vacío |
| `apps/student` | App del estudiante; el apk con Capacitor es una posibilidad futura | Vacío |
| `apps/teacher/{web,mobile}` | App del docente (estructura por confirmar; apk futura) | Vacío |
| `web/portal` | Índice que enlaza a los prototipos; luego, el dashboard real | Vacío |
| `services/backend` | Java + Spring Boot | Futuro |
| `db` | Base relacional con soporte JSON | Futuro |
| `infra` | Script de build de Pages y espacio reservado para Docker futuro | Base |
| `.github/workflows` | Pages preparado con guardas; sin CI, Android ni publicación Docker activos | Preparación |
| `docs` | Documentación del proyecto | Base |
| `skills` (repo privado) | Skills de agentes; su fuente está en `allinchile-anexos/skills/` y Notion mantiene un espejo. No se versionan en este repo | Privado |

Detalle en [docs/estructura.md](docs/estructura.md).

## Flujo de trabajo

- Una vez creado el repo en GitHub, `main` será el trunk protegido y solo se cambiará por Pull Request. Esa protección aún no está configurada.
- Una rama por tarea o proyecto (no por persona): `<tipo>/kan-<n>-<descripcion>`, por ejemplo `proto/kan-14-montessori`.
- Mientras no exista CI útil, cada PR debe documentar su verificación manual. Pages publicará solo cuando existan el portal mínimo y los prototipos base implementados y enlazados.

Ver [CONTRIBUTING.md](CONTRIBUTING.md) y [docs/despliegue.md](docs/despliegue.md).

## Enlaces

- Sitio oficial: <https://www.duoc.cl/allinchile2026/>
