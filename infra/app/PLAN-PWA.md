# PLAN PWA (Agente 1 «APP WEB»)

## Resumen vivo
- Estado: EN CURSO. Repo principal: script, pruebas y README hechos; falta abrir PR del workflow. Repo anexo: pendiente.
- PR: ver «Historial».
- Orden de merge recomendado: 1) PR del script (`feat/app-pwa-inyeccion`), 2) PR del workflow (único cambio a algo existente). Si se fusiona al revés no pasa nada: el paso avisa y publica sin PWA.

## Checklist repo principal
- [x] Script `inject-pwa.mjs` (manifest, íconos PNG por código, sw.js, etiquetas, Capacitor desactivado)
- [x] Pruebas unitarias (`node --test infra/app/inject-pwa.test.mjs`)
- [x] Prueba en Chromium: SW registrado, manifest, offline, actualización, sin errores de consola, Capacitor sin registro
- [x] dist idéntico salvo archivos nuevos y etiquetas en index.html (comparado con `diff -rq`)
- [x] README
- [ ] PR del script abierta
- [ ] PR del workflow (rama aparte, solo el paso)

## Checklist repo anexo
- [ ] Revisar `ref/prototipos-nicolas/sitio/construir.mjs` y dist-site
- [ ] Carpeta análoga con script + pruebas + README
- [ ] PR del script
- [ ] PR del workflow `pages-pruebas.yml`

## Lecturas de duda
- El repo real se llama `kairosmethod_all_in` (minúsculas en el remoto); el base path sale de `GITHUB_REPOSITORY`.
- No se recarga automáticamente la página al llegar una versión nueva (evita cortar un temporizador); la siguiente apertura ya trae lo nuevo.
- `deploy-pages.yml` solo se dispara por cambios en portal/prototipos/script de build/workflow; cambios en `infra/app/` no redespliegan solos (se puede lanzar a mano). No lo cambio para respetar «solo agregar un paso».
- El job de build sigue condicionado a `vars.PAGES_REQUIRED_PROTOTYPES`; no lo toco.

## Historial
- 2026-10-14 02:28 (Santiago) inicio disparo 1. Lock `lock/app-pwa` tomado en ambos repos.
