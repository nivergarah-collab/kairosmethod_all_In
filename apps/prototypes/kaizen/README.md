# Jardín de hábitos Kaizen

**Kaizen v2.** El jardín abre directamente en una escena fotográfica con cuatro zonas y plantas movibles. La documentación siguiente conserva como referencia el recorrido de la versión anterior; sus reglas de penalización y onboarding no se aplican a v2.

Prototipo local para explorar microacciones de aprendizaje, cuidado diario y crecimiento gradual. No necesita servidor, cuenta ni conexión para sus funciones principales. El estado se guarda en `localStorage` de este dispositivo.

## Ejecutar

Requiere Node.js 20.19+ o 22.12+.

```sh
npm install
npm run dev
```

Validación del proyecto:

```sh
npm test
npm run build
```

## Recorrido

1. En el primer uso, elige un enfoque para cada una de las tres familias.
2. Cuida cada planta una vez al día; los detalles permiten editarla o congelarla en el herbario.
3. Crea microacciones propias desde **Nueva planta**. El vivero ofrece dos semillas adicionales después de una semana saludable simulada.
4. Abre **Ajustes** para exportar un archivo JSON, revisar una copia antes de importarla o comenzar un jardín nuevo.

## Tutorial

Versión 0.2.0. La primera vez que se entra, un recorrido guiado de 14 pasos oscurece la pantalla y resalta cada parte del jardín: la elección de semillas, los cuatro rincones, el cuidado diario, los detalles de la planta, ver detalles y organizar, el reloj virtual, el menú, la creación de microacciones, el Vivero, el Herbario y los Ajustes.

- Se puede saltar en cualquier paso («Saltar tutorial» o Escape) y se navega con «Anterior», «Siguiente» y las flechas del teclado.
- El botón **?** («Ver tutorial»), junto a la fecha en la escena y en la cabecera de las demás vistas, vuelve a abrirlo.
- Usa plantas de ejemplo solo en memoria: no cambia ni guarda nada en tu jardín. Al cerrar, vuelves a la vista inicial.
- Recuerda que ya se vio en `localStorage` con la clave `kairos_kaizen_tutorial_v1`, distinta de la de los datos (`kaizen-garden-v2`). Si el almacenamiento falla, la app sigue funcionando y el tutorial no se abre solo.
- El código vive en `src/tutorial/` (pasos, avance, persistencia y posición de la tarjeta sin React, con pruebas en `src/tutorial/tutorial.test.js`); los elementos resaltados se marcan con atributos `data-tour`.

## Modo demo

Los controles demo permiten avanzar un día o una semana, simular una semana saludable, simular una recuperación y volver a la fecha local real. Solo cambian el reloj virtual guardado en el jardín; nunca ajustan la hora del dispositivo. Al volver a hoy, las fechas futuras creadas durante la demo dejan de bloquear el cuidado del día real.

## Copias locales

La exportación contiene el jardín y su historial serializados como JSON. La importación valida el formato y muestra el número de plantas activas, entradas del herbario y última actividad; los datos actuales solo se reemplazan después de confirmar. El archivo no se envía a ningún servicio.

## Reglas de este prototipo

Un cuidado diario suma un punto de crecimiento y recupera hasta cinco puntos de vitalidad. Una omisión no penaliza; dos omisiones consecutivas restan diez puntos. Vitalidad y crecimiento son indicadores ajustables para la demo, no medidas científicas.
