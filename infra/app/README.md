# PWA: la página instalable como aplicación

`inject-pwa.mjs` convierte el sitio ya construido (`dist/`) en una PWA **sin tocar el código fuente**: se ejecuta después de `infra/scripts/build-site.sh`, así la app instalada siempre es la versión real de la página (portal + prototipos).

## Qué agrega a `dist/`

- `manifest.webmanifest` (standalone, `scope` y `start_url` bajo el base path, accesos directos a los prototipos).
- Íconos PNG generados por código (192 y 512, normales y *maskable*, más `apple-touch-icon.png`). No se descarga nada.
- `sw.js`: HTML y archivos sin hash → red primero (con respaldo offline); `assets/` con hash → caché primero. El caché lleva el hash del build, así que cada despliegue reemplaza al anterior; un `index.html` nuevo se ve en la siguiente apertura (no se recarga una página en uso, para no cortar un Pomodoro en curso).
- En cada `index.html`: `link rel=manifest`, `apple-touch-icon` y un registro del service worker que **no se ejecuta dentro de Capacitor** (`window.Capacitor`), para que el APK use la web empaquetada.

## Uso

```bash
BASE_PATH=/kairosmethod_all_in REQUIRED_PROTOTYPES=montessori,pomodoro,kaizen,spaced bash infra/scripts/build-site.sh
node infra/app/inject-pwa.mjs --dir dist --base /kairosmethod_all_in   # BASE_PATH sirve de respaldo
```

Opciones: `--name`, `--short-name`, `--description`, `--theme-color`, `--background-color`, `--lang`. Si el script falla no deja etiquetas a medias (los `index.html` se editan al final) y sale con código 1.

## Cómo se prueba

- `node --test infra/app/inject-pwa.test.mjs` (manifest, base path, SW, idempotencia, fallos).
- Manual: servir `dist/` bajo el base path, abrir en Chrome → DevTools › Application: manifest sin errores y service worker activo; en celular, «Instalar aplicación».

## Cómo revertir

Borrar el paso «Inyectar PWA» de `.github/workflows/deploy-pages.yml` (la página vuelve a publicarse sin PWA). Para que los usuarios con la app ya instalada no queden con un service worker viejo, publicar antes un `sw.js` que se desregistre; o basta que el sitio siga sirviendo (el SW solo usa red primero para HTML).

Seguimiento del trabajo: `PLAN-PWA.md`.
