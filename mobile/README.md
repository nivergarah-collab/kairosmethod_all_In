# mobile — apk Android (Capacitor)

Empaqueta **el mismo sitio que publica GitHub Pages** (portal + prototipos) dentro de un apk instalable. No contiene código de interfaz: solo la configuración de Capacitor y dos scripts pequeños. El proyecto `android/` y la carpeta `www/` se **regeneran en cada build** y no se versionan.

## Qué pasa en cada merge a `main`

El workflow `.github/workflows/build-apk.yml` (independiente de `deploy-pages.yml`, con los mismos filtros de rutas) se dispara cuando cambia el portal, un prototipo, el script de build, `mobile/` o el propio workflow. Hace:

1. Construye el sitio con `infra/scripts/build-site.sh` y `PAGES_REQUIRED_PROTOTYPES`, igual que Pages, pero con base `/` (dentro del apk la WebView sirve desde su propio origen). Si la variable está vacía, el job se omite.
2. `scripts/prepare-web.mjs` copia `dist/` a `mobile/www/` y agrega `capacitor-dirs.js`: la WebView de Capacitor no sirve carpetas (`/prototypes/pomodoro/` devolvería el portal), así que ese script lleva los enlaces a carpetas a su `index.html`. Solo toca la copia, nunca el código fuente.
3. `npx cap add android` + `cap sync`, y `scripts/set-version.mjs` pone `versionCode` = número de ejecución y `versionName` = `<version de mobile/package.json>-<sha corto>`.
4. JDK 17 + Gradle: `assembleDebug`, o `assembleRelease` firmado con tu clave si existen los 4 secretos (abajo).
5. Sube el apk como artefacto del workflow (`kairos-apk`, 30 días) y lo publica en el Release **`apk-latest`** (se recrea en cada build; contiene `kairos-<repo>-<sha>.apk` y `kairos-latest.apk`).

Un fallo de este workflow no afecta al despliegue de Pages.

## Descargar e instalar

1. En el celular abre `https://github.com/<usuario>/<repo>/releases/tag/apk-latest` y descarga **kairos-latest.apk**.
2. Abre el archivo. Android pedirá permitir «instalar apps desconocidas» para el navegador o gestor de archivos que lo abrió: acéptalo.
3. Instala y abre **KairosMethod**.

En un repo privado hay que haber iniciado sesión en GitHub en el celular para ver el Release.

## Actualizar sin desinstalar: clave de firma propia (opcional)

Sin secretos, el apk es **debug** y se firma con una clave distinta en cada build: Android pedirá desinstalar la versión anterior (se pierden los datos locales). Con una clave propia las actualizaciones se instalan encima.

1. Crea la keystore **en tu computador** (necesita JDK; el archivo nunca se sube al repo):
   `keytool -genkeypair -v -keystore kairos-release.keystore -alias kairos -keyalg RSA -keysize 2048 -validity 10000`
2. Guárdala y anota las contraseñas en un lugar seguro: si la pierdes, no podrás actualizar.
3. Conviértela a texto: `base64 -w0 kairos-release.keystore` (en macOS: `base64 -i kairos-release.keystore`).
4. En GitHub: Settings → Secrets and variables → Actions → New repository secret, crea estos cuatro:
   `ANDROID_KEYSTORE_BASE64` (el texto del paso 3), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`kairos`), `ANDROID_KEY_PASSWORD`.
5. El siguiente build sale firmado (`assembleRelease` + `apksigner`). Solo vale si están los cuatro; si falta uno, vuelve a debug.

## Probar en local

```
BASE_PATH="" REQUIRED_PROTOTYPES=montessori,pomodoro,kaizen,spaced bash infra/scripts/build-site.sh
cd mobile && npm ci && npm test
node scripts/prepare-web.mjs ../dist www && npx cap add android
cd android && ./gradlew assembleDebug     # requiere JDK 17 y Android SDK
```

## Notas

- Los prototipos que cargan recursos externos (p. ej. fuentes de Google en Repetición Espaciada) necesitan internet para esos recursos.
- Compatibilidad: Capacitor 6 (JDK 17, compileSdk 34, minSdk 22). Subir de versión es una tarea aparte.
- Si la página registra un service worker, el Agente de la PWA lo desactiva dentro de Capacitor (`window.Capacitor`).

## Revertir

Borrar `.github/workflows/build-apk.yml` y la carpeta `mobile/` en una PR, y borrar el Release `apk-latest` a mano. Nada más depende de ellos.
