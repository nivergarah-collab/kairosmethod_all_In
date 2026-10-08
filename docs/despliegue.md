# Despliegue

| Qué | Cuándo | Cómo | Workflow |
|---|---|---|---|
| Verificación de Pull Request | En cada PR | Prueba manual documentada mientras no haya CI útil | Sin workflow activo |
| Sitio web (portal + prototipos base) | Después de crear/enlazar repo y completar el portal y sus prototipos enlazados | GitHub Pages | `deploy-pages.yml` (preparado y protegido; aún no publicar) |
| Apk de `student` (Capacitor) | Futuro, al implementar app y configuración | Por definir | Sin workflow activo |
| Imagen Docker del backend | Futuro, cuando haya backend, Dockerfile y destino elegido | Por definir | Sin workflow activo |
| Release de apk firmado | Futuro (tag de versión) | GitHub Releases | pendiente |

## Sitio en GitHub Pages

- Portal en la raíz: `https://<usuario>.github.io/<repo>/`
- Prototipos (un proyecto responsive cada uno): `<base-del-repo>/prototypes/<nombre>/`
- El build exige `web/portal/package.json`, una lista explícita de selección y `package.json` para cada prototipo seleccionado. Construye exactamente esa lista, comprueba su `dist/index.html` y valida que cada enlace del portal incluya la base del repo (`/<repo>/prototypes/<nombre>/`). Si falta una condición, falla sin desplegar.
- Tras crear el repo, configurar la variable de Actions `PAGES_REQUIRED_PROTOTYPES` con los nombres seleccionados separados por coma (por ejemplo, `kaizen,pomodoro`). Mientras esté vacía, los jobs quedan omitidos; así el primer push del esqueleto no falla. `workflow_dispatch` queda disponible cuando la lista esté configurada.
- El disparo automático observa todos los archivos del portal/prototipos excepto sus README, además del script y el workflow; así incluye código, recursos y configuraciones sin disparar por cambios de documentación.
- Cada app web debe aceptar `--base` en su build (Vite: `vite build --base=...`).

## Puesta en marcha (una sola vez)

1. Crear y enlazar el repo público en GitHub (sin organización); configurar Pages con **GitHub Actions** cuando corresponda.
2. Proteger `main` con PR obligatorio. No exigir un check de CI mientras no exista un workflow de CI útil.
3. Añadir y enlazar el portal mínimo y los prototipos base elegidos; Pages publicará al cumplirse las guardas descritas arriba.

## Pendiente

- Implementar portal y prototipos base para la primera publicación en Pages.
- Implementar `student`, Capacitor y su build de Android.
- Apk del docente: por confirmar con su estructura.
- Backend, base de datos, destino Docker y despliegue de fase posterior.
