# PLAN-APK — Agente 2 «APK» (All In Chile 2026)

## Resumen vivo
- Carpeta elegida: `mobile/` (en ambos repos). Workflow: `.github/workflows/build-apk.yml`.
- Estado repo principal: código y pruebas listos; PR #12 abierta. Esperando merge de Nicolás.
- Estado repo anexo: código y pruebas listos; PR #73 abierta (su PLAN vive en el anexo). Esperando merge.
- **APK COMPLETO en ambos repos: NO todavía.**

## Checklist
- [x] Lock `lock/app-apk` en ambos repos
- [x] Principal: `mobile/` (Capacitor 6.2.1, config, scripts, pruebas, README)
- [x] Principal: workflow `build-apk.yml` (YAML válido, mismos filtros de rutas que Pages más los propios)
- [x] Principal: prueba Chromium (portal + 4 prototipos, base `/`, servidor que imita la WebView)
- [x] Principal: `cap add android` + `sync` verificados; PR abierta
- [x] Anexo: `mobile/` + workflow `build-apk.yml` (sitio con `node sitio/construir.mjs`)
- [x] Anexo: prueba Chromium (21 páginas sin errores) y PR abierta
- [ ] Tras el merge: revisar por API que el workflow corrió y el Release `apk-latest` existe; corregir con PR nueva si falló

## Decisiones / lecturas de duda
- Capacitor 6 (no 7) para cumplir «JDK 17» del encargo.
- Base `/` (BASE_PATH vacío): la WebView sirve desde `https://localhost/`; las rutas absolutas funcionan. Problema encontrado: la WebView de Capacitor responde el `index.html` raíz a cualquier ruta sin extensión (html5mode), por lo que `/prototypes/x/` mostraría el portal. Solución sin tocar el fuente: `capacitor-dirs.js` se inyecta solo en la copia `www/` y reescribe el clic a `.../index.html`. Limitación: navegación por JS (`location.href = carpeta/`) no queda cubierta; hoy el portal usa enlaces `<a>`.
- Release `apk-latest` se borra y recrea en cada build (`--cleanup-tag`) para que la etiqueta apunte al commit actual y haya un solo apk. Ventana de segundos sin Release durante la recreación.
- `android/` no se commitea (regenerable); se parchea solo versionCode/versionName.
- Firma con `apksigner` sobre `assembleRelease` sin firmar, para no editar el gradle generado.
- No se editó `docs/` ni `CHANGELOG.md` (el encargo pide solo archivos nuevos): queda como seguimiento.
- No se pudo compilar el APK localmente: `dl.google.com` y `services.gradle.org` devuelven 403 desde este entorno (sin Android SDK). Se verificó hasta `cap add android`/`sync`.

## Historial
- 2026-10-14 02:58–03:12 (disparo 1, ~14 min efectivos): lock, `mobile/`, workflow, pruebas; PR #12 (principal) y PR #73 (anexo). Pendiente: merge de Nicolás y primer run del workflow (no se pudo compilar el apk localmente por 403 a dl.google.com/services.gradle.org).
