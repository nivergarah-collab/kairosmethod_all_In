# apps/

Aplicaciones del proyecto. Cada carpeta hija es independiente (se construye y despliega por separado).

- `prototypes/`: pruebas aisladas por método de estudio, sin backend. La persistencia se decide por prototipo; Kaizen prevé persistencia local ligera. Cada uno será un proyecto React responsive (solo web).
- `student/`: aplicación futura del estudiante. El modelo previsto es React responsive; Capacitor y el apk aún no están implementados. Ver [docs/mobile.md](../docs/mobile.md).
- `teacher/`: aplicación del docente. Estructura **por confirmar** (hoy `web/` y `mobile/` separadas).
