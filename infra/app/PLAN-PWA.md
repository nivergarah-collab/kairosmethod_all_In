# PLAN PWA (Agente 1 «APP WEB»)

## Resumen vivo
- Estado: **PWA COMPLETA en ambos repos** (a la espera de que Nicolás fusione las PR; nada más que hacer).
- PR principal: #10 (script) y #11 (workflow). PR anexo: #71 (script, carpeta `app-pwa/`) y #72 (workflow).
- Orden de merge recomendado: 1) PR del script (`feat/app-pwa-inyeccion`), 2) PR del workflow (único cambio a algo existente). Si se fusiona al revés no pasa nada: el paso avisa y publica sin PWA.

## Checklist repo principal
- [x] Script `inject-pwa.mjs` (manifest, íconos PNG por código, sw.js, etiquetas, Capacitor desactivado)
- [x] Pruebas unitarias (`node --test infra/app/inject-pwa.test.mjs`)
- [x] Prueba en Chromium: SW registrado, manifest, offline, actualización, sin errores de consola, Capacitor sin registro
- [x] dist idéntico salvo archivos nuevos y etiquetas en index.html (comparado con `diff -rq`)
- [x] README
- [x] PR del script abierta (#10)
- [x] PR del workflow (#11, rama aparte, solo el paso)

## Checklist repo anexo
- [x] Revisar `ref/prototipos-nicolas/sitio/construir.mjs` y dist-site
- [x] Carpeta análoga con script + pruebas + README
- [x] PR del script (#71)
- [x] PR del workflow `pages-pruebas.yml` (#72)

## Lecturas de duda
- El repo real se llama `kairosmethod_all_in` (minúsculas en el remoto); el base path sale de `GITHUB_REPOSITORY`.
- No se recarga automáticamente la página al llegar una versión nueva (evita cortar un temporizador); la siguiente apertura ya trae lo nuevo.
- `deploy-pages.yml` solo se dispara por cambios en portal/prototipos/script de build/workflow; cambios en `infra/app/` no redespliegan solos (se puede lanzar a mano). No lo cambio para respetar «solo agregar un paso».
- El job de build sigue condicionado a `vars.PAGES_REQUIRED_PROTOTYPES`; no lo toco.

## Historial
- 2026-10-14 02:28 (Santiago) inicio disparo 1. Lock `lock/app-pwa` tomado en ambos repos.
- 2026-10-14 ~02:45 (Santiago) fin disparo 1 (~17 min efectivos): todo hecho y probado; cierro antes del minuto 40 porque no queda trabajo útil. Anexo: la copia del script en `app-pwa/` debe mantenerse igual a esta (misma lógica). Lo no hecho: instalar en un celular real (no hay dispositivo; probado en Chromium). Error 404 aislado en la prueba del anexo (probablemente favicon.ico del navegador; no reproducible).
