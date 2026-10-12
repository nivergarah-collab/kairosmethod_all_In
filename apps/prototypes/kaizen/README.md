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

## Modo demo

Los controles demo permiten avanzar un día o una semana, simular una semana saludable, simular una recuperación y volver a la fecha local real. Solo cambian el reloj virtual guardado en el jardín; nunca ajustan la hora del dispositivo. Al volver a hoy, las fechas futuras creadas durante la demo dejan de bloquear el cuidado del día real.

## Copias locales

La exportación contiene el jardín y su historial serializados como JSON. La importación valida el formato y muestra el número de plantas activas, entradas del herbario y última actividad; los datos actuales solo se reemplazan después de confirmar. El archivo no se envía a ningún servicio.

## Reglas de este prototipo

Un cuidado diario suma un punto de crecimiento y recupera hasta cinco puntos de vitalidad. Una omisión no penaliza; dos omisiones consecutivas restan diez puntos. Vitalidad y crecimiento son indicadores ajustables para la demo, no medidas científicas.
