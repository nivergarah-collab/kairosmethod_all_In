# Guía de contribución

## Ramas

- `main`: será el trunk protegido después de crear el repo GitHub. Nadie debe hacer push directo; hasta configurar GitHub, esta regla es una instrucción de trabajo, no una protección técnica activa.
- **Una rama por tarea o proyecto, no por persona.** Por ejemplo, una rama para el prototipo Montessori. Se integra a `main` cuando está terminada y verificada, y se borra al hacer merge. Varias personas pueden trabajar en la misma rama.
- Formato: `<tipo>/kan-<n>-<descripcion-corta>`, por ejemplo `proto/kan-14-montessori`.
- Tipos: `proto` (prototipo), `feat` (funcionalidad), `fix` (corrección), `infra` (workflows, Docker, scripts), `docs`.

## Commits

Mensajes breves en español, en imperativo, con el ticket cuando aplique:
`KAN-15: agrega temporizador de bloques`.

## Pull Requests

1. Abre el PR contra `main` usando la plantilla.
2. Revisión por pares: la revisa otra persona del equipo (puede ser de palabra). Quien abre el PR deja en un comentario quién lo revisó.
3. El cambio debe estar verificado: prueba manual documentada mientras no exista CI útil; anotar en el PR cómo se verificó.
4. Merge con *squash*; la rama se borra.

## Reglas de código

- Nombres de carpetas, archivos y código en **inglés**; documentación y comentarios de producto en **español**.
- Cada app se construye por separado: no importes código entre carpetas de `apps/`.
- Un solo proyecto responsive por app: no crees versiones separadas para celular (salvo `apps/teacher/`, por confirmar). Ver [docs/mobile.md](docs/mobile.md).
- Nunca subas secretos, keystores ni `.env` (ver `.gitignore`).
