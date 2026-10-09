# Instrucciones para agentes

Este archivo es el punto de entrada para **cualquier agente de IA** (Claude, GPT, OpenCode u otro) que trabaje en este repositorio. Todos siguen las mismas reglas.

## Skills

Las skills del proyecto **no están en este repo público**. Su fuente es la carpeta `skills/` del repo privado `allinchile-anexos`; Notion mantiene una copia espejo. No se distribuyen por ZIP ni pendrive.

1. Si el repo privado está clonado junto a este proyecto, lee `../allinchile-anexos/skills/core/project-startup/SKILL.md` antes de empezar y sigue su tabla de rutas.
2. Si no tienes acceso a esa carpeta, trabaja con las reglas de este archivo y avisa a la persona que las skills del proyecto no están disponibles en tu entorno.

## Reglas clave del repo

- Una vez creado el repo GitHub, proteger `main`: nada se sube directo, todo entra por Pull Request. Esa regla aún no está configurada.
- **Los agentes sí abren Pull Request; lo que no hacen nunca es el merge.** Al terminar una tarea, el agente sube su rama y abre la PR hacia `main` (título y descripción en español). El merge lo hace siempre una persona.
- Una rama por tarea o proyecto (`<tipo>/kan-<n>-<descripcion>`), no por persona.
- Nunca subir secretos (`.env`, keystores, tokens) ni archivos generados (`dist/`, `*.apk`).
- Nombres de código y carpetas en inglés; documentación y commits en español.
- No uses `push --force`, `reset --hard` ni borres trabajo ajeno sin aprobación explícita.
- No inventes comandos, operaciones de herramientas ni datos: si algo no existe, dilo.
