# Portal

Página principal del despliegue. Proyecto React (Vite) responsive.

- **Hoy:** índice de los métodos de estudio. Los habilitados enlazan a su prototipo; los que aún no lo están se muestran como «Próximamente» y no tienen enlace. Actualmente solo **Montessori** está habilitado; Pomodoro, Kaizen y «Por definir» figuran como próximamente.
- **Mañana:** se reutiliza para construir el dashboard real (gestor de espacios de trabajo).

## Cómo se actualiza la lista de métodos

La fuente única es `src/methods.js` (`status: 'available'` o `'soon'`). Para habilitar un método:

1. Crear su prototipo en `apps/prototypes/<id>/` (con `package.json` y script `build`).
2. Cambiar su `status` a `'available'` en `src/methods.js`.
3. Agregar su enlace al bloque `<noscript>` de `index.html`. El build de Pages (`infra/scripts/build-site.sh`) valida los enlaces sobre ese archivo porque el portal se dibuja con JavaScript; `src/methods.test.js` comprueba que ambos coincidan.
4. Añadir el id a la variable de Actions `PAGES_REQUIRED_PROTOTYPES`.

Los enlaces conservan la base del repo (`import.meta.env.BASE_URL`), así que funcionan bajo `/<repo>/prototypes/<id>/`.

## Comandos

```bash
npm ci            # instalar dependencias
npm run dev       # desarrollo
npm test          # pruebas (node --test, sin librerías extra)
npm run build     # genera dist/ (acepta --base=/<repo>/)
```

Se publicará en la raíz de GitHub Pages al configurar el repo y `PAGES_REQUIRED_PROTOTYPES`; ver [docs/despliegue.md](../../docs/despliegue.md).
