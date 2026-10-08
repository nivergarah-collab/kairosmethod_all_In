# Decisiones del repositorio

| Fecha | Decisión | Estado |
|---|---|---|
| 2026-10-05 | Monorepo con trunk (`main`) y una rama por **tarea o proyecto** (no por persona), p. ej. `proto/kan-14-montessori`; se integra al terminar y verificar (CI o prueba manual) | Decidido |
| 2026-10-05 | Nombre del repo: `kairosmethod` | Decidido |
| 2026-10-05 | Nombres en inglés, documentación en español | Decidido |
| 2026-10-05 | Web en React; backend Java + Spring Boot; base relacional con JSON | Decidido |
| 2026-10-05 | ~~Sitio en GitHub Pages (portal en raíz, prototipos en subrutas); apk con GitHub Actions + artefactos~~ | Pages preparado con guardas; apk/workflow pendiente de implementar |
| 2026-10-05 | ~~Apps móviles nativas e independientes de la web; Pomodoro actual se importa copiando el código~~ | Reemplazada el 2026-10-07 por el modelo responsive + Capacitor |
| 2026-10-05 | ~~Apk por prototipo con regla de dos capas (módulo + cáscara) para integrarlos luego al apk principal~~ | Reemplazada el 2026-10-07 (los prototipos ya no tienen apk) |
| 2026-10-05 | Las skills de agentes **no se suben al repo**: la carpeta `skills/` está en `.gitignore`. Se comparten por Notion y por zip en pendrive, con un encargado único de su mantenimiento (por designar). Reemplaza la decisión anterior de tenerlas en el repo | Reemplazada el 2026-10-08 |
| 2026-10-05 | ~~Las skills de Notion/Jira/Confluence viven en la misma carpeta local, en `skills/workspace/`~~ | Reemplazada el 2026-10-08 por la fuente privada de skills y su espejo en Notion |
| 2026-10-05 | Skills `menu-de-skills` y `consultar-skills-activas` descartadas (las reemplaza `skills/README.md`) | Decidido |
| 2026-10-05 | Revisión por pares de palabra (sin aprobación formal en GitHub); merge con squash | Decidido |
| 2026-10-05 | Mensajes de commit en español | Decidido |
| 2026-10-05 | Changelogs separados: `CHANGELOG.md` del repo (código) y 📜 CHANGELOG de Notion (workspace); el del repo se refleja en Notion | Decidido (mecanismo por confirmar) |
| 2026-10-05 | Skills compartidas por todos los agentes (Claude, GPT, OpenCode...) mediante `AGENTS.md` (público, con las reglas esenciales) como punto de entrada único; remite a `skills/` si existe localmente | Decidido |
| 2026-10-05 | En Jira/Confluence el agente puede cambiar contenido sin pedir confirmación si señala dónde cambió y deja el texto original tachado; la limpieza del tachado es aparte | Decidido |
| 2026-10-07 | ~~Tecnología móvil: Kotlin o Java puro~~ → la tecnología móvil es **Capacitor** sobre el proyecto React | Resuelta |
| 2026-10-08 | `kairosmethod` será repo público con colaboradores, sin organización de GitHub | Decidido |
| 2026-10-08 | No añadir archivo de licencia al iniciar el repo; visibilidad pública no equivale a conceder permiso explícito de reutilización | Decidido |
| 2026-10-08 | Crear/enlazar el repo GitHub es un paso del usuario; Pages se publicará después, cuando haya portal mínimo y prototipos base implementados y enlazados | Decidido |
| 2026-10-08 | No mantener workflows CI, Android ni Docker activos hasta que exista una tarea ejecutable en cada etapa | Decidido |
| 2026-10-08 | Kaizen puede necesitar persistencia local ligera; no implica backend ni sincronización. Los demás prototipos definen persistencia por separado | Decidido |
| 2026-10-05 | Apk debug es suficiente por ahora (sin firma/release) | Decidido |
| — | Motor de base de datos | Pendiente |
| 2026-10-07 | Modelo responsive: cada app es un solo proyecto React que se adapta al tamaño de pantalla; se acaban las apps móviles nativas independientes. Motivos: menos trabajo y el plazo del torneo | Decidido |
| 2026-10-07 | El apk de Android sale del mismo proyecto con Capacitor, con la web empaquetada dentro (no abre la web publicada) | Decidido |
| 2026-10-07 | Prototipos (pomodoro, montessori, kaizen): una carpeta por prototipo, solo web responsive, sin `web/`, `mobile/` ni apk | Decidido |
| 2026-10-07 | `apps/student/`: un solo proyecto, sin `web/` ni `mobile/`; la web y el apk salen del mismo código | Decidido |
| 2026-10-07 | `apps/teacher/` mantiene `web/` y `mobile/` separadas (la app de celular y la web son cosas diferentes); estructura final por confirmar y fuera de esta fase | Por confirmar |
| 2026-10-07 | `docs/mobile.md` pasa a describir el modelo responsive + Capacitor (reemplaza la regla de dos capas) | Decidido |
| 2026-10-08 | La fuente de las skills es `skills/` en el repo privado `allinchile-anexos`; Notion mantiene un espejo. No se distribuyen por ZIP/pendrive ni se copian al repo público `kairosmethod` | Vigente |
| 2026-10-08 | El portal lista los métodos y marca como «Próximamente» los que aún no tienen prototipo (hoy Pomodoro, Kaizen y «Por definir»); el primer método habilitado es Montessori, y entra con la versión 0.5.13 de su prototipo | Decidido |
