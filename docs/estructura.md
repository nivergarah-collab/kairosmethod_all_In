# Estructura del repositorio

```
.github/            workflow de Pages preparado, plantillas de PR e issues
apps/
  prototypes/<método>/   un proyecto React responsive por método (pomodoro, montessori, kaizen); solo web
  student/               app futura; Capacitor/apk aún no implementados
  teacher/{web,mobile}   estructura por confirmar; no se trabaja en esta fase
web/portal/         índice hoy; dashboard real mañana
services/backend/   Java + Spring Boot (futuro)
db/                 base relacional con soporte JSON (futuro)
infra/{docker futuro,scripts}
docs/
```

## Principios

1. **Cada app es independiente.** El build de Pages reúne el portal y la lista explícita de prototipos seleccionados; no hay CI incremental activo.
2. **Prototipos aislados ≠ proyecto final.** Un prototipo nunca depende de `student/`; en cambio `student/` podrá reutilizar la lógica de los prototipos.
3. **Una sola interfaz responsive por app (modelo del 07-oct).** Prototipos y `student/` son un único proyecto React que se adapta a PC y celular según el tamaño de pantalla. No hay subcarpetas `web/` y `mobile/` ni código de interfaz duplicado. Detalle en [mobile.md](mobile.md).
4. **Excepción: `teacher/`.** Ahí la web y la app de celular son cosas diferentes, así que se mantienen `web/` y `mobile/` hasta confirmar la estructura final.
5. **No hay backend ni persistencia compartida.** Un prototipo puede guardar datos localmente si su método lo requiere; Kaizen prevé persistencia local ligera. Esto no sincroniza dispositivos ni crea un backend.

## Cómo agregar un proyecto nuevo

1. Crea la carpeta bajo `apps/` con un `README.md` y un único proyecto React (Vite) con diseño responsive.
2. Para incluir un prototipo en Pages, debe figurar en `PAGES_REQUIRED_PROTOTYPES`, tener `package.json` con script `build` y producir `dist/index.html`; el portal debe enlazarlo bajo `/<repo>/prototypes/<nombre>/` (respetando la base del repo).
3. Si `student/` llega a requerir apk, Capacitor se agrega al mismo proyecto responsive. Ver [mobile.md](mobile.md).
