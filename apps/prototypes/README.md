# apps/prototypes/

Prototipos aislados, uno por método de estudio (KAN-14, KAN-15, KAN-16). No tienen backend; la persistencia se decide según cada método. Kaizen prevé guardar datos localmente, sin sincronización.

Cada prototipo es **un solo proyecto React responsive** (PC y celular) en su propia carpeta, sin subcarpetas `web/` ni `mobile/`. No tiene apk: los seleccionados para la primera publicación se configuran en `PAGES_REQUIRED_PROTOTYPES` y se publican bajo `<base-del-repo>/prototypes/<nombre>/`; el portal debe enlazarlos conservando esa base.

Estado: implementados **Montessori** (v0.5.13, `montessori/`), **Pomodoro** (v0.1.0, `pomodoro/`), **Kaizen** (v0.1.0, `kaizen/`) y **Repetición Espaciada** (v3.0.0, `spaced/`). El portal enlaza los cuatro.

Cuando un prototipo madure, su lógica se reutiliza en `student/`; el prototipo sigue existiendo como referencia aislada.
