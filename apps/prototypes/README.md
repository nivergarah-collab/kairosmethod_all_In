# apps/prototypes/

Prototipos aislados, uno por método de estudio (KAN-14, KAN-15, KAN-16). No tienen backend; la persistencia se decide según cada método. Kaizen prevé guardar datos localmente, sin sincronización.

Cada prototipo es **un solo proyecto React responsive** (PC y celular) en su propia carpeta, sin subcarpetas `web/` ni `mobile/`. No tiene apk: los seleccionados para la primera publicación se configuran en `PAGES_REQUIRED_PROTOTYPES` y se publican bajo `<base-del-repo>/prototypes/<nombre>/`; el portal debe enlazarlos conservando esa base.

Estado: implementados **Montessori** (v0.6.0, `montessori/`), **Pomodoro** (v0.3.0, `pomodoro/`), **Kaizen** (v0.2.0, `kaizen/`) y **Repetición Espaciada** (v3.1.0, `spaced/`). El portal enlaza los cuatro.

Los cuatro tienen un **tutorial guiado** de primera vez, con botón «?» («Ver tutorial») para repetirlo. Cada prototipo lleva su propia implementación en `src/tutorial/` (no se importa código entre carpetas de `apps/`) y recuerda en `localStorage` si ya se vio, con la clave `kairos_<prototipo>_tutorial_v1`. **Pomodoro** además es responsivo por ancho de pantalla: en celular se ve como la app de Android y en tablet y PC aprovecha el espacio. Desde la v0.3.0 ofrece cinco visiones de la misma sesión (Pomodoro, Calma, Visión, Paridad e Investigación), paletas de color y descansos configurables (ver su README).

Cuando un prototipo madure, su lógica se reutiliza en `student/`; el prototipo sigue existiendo como referencia aislada.
