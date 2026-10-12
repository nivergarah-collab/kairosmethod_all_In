# Recursos visuales de Kaizen v2

Estos recursos se generaron para este prototipo con la herramienta integrada ImageGen el 08-10-2026 y en ejecuciones posteriores. Son archivos locales: la aplicación no consulta servicios de imágenes. Las nueve imágenes servidas por la aplicación son WebP lossless, equivalentes píxel a píxel a sus originales PNG (que no se incluyen en este repositorio). La decodificación WebP se comparó píxel por píxel con cada original. El conjunto servido pasó de 19.94 MB a 13.67 MB (31.4% menos).

`garden-zones-v2.webp` es el atlas de cuatro ambientes usado por la escena; `garden-zones.png` es el atlas anterior que se conserva en la carpeta de originales. `cactus.webp`, `jade.webp` y `succulent.webp` son tres recortes independientes con alpha transparente real. El atlas de plantas inicial se descartó al detectar fragmentos de hojas vecinas. `seed-under-soil.webp` y `seedling-cotyledons.webp` cubren las etapas tempranas; las macetas existentes se conservan y el follaje adulto se revela al llegar al hito de planta establecida. Las variantes `*-repotted.webp` muestran una maceta mayor solo después del trasplante confirmado por la persona.

## Prompt final: garden-zones.png

Create a production photographic background atlas for a tranquil immersive habit garden web application. One single image with EXACTLY four equally sized rectangular photographs in a seamless 2 by 2 grid, no gutters, no borders, no text, no UI, no people. Each quadrant has a different spacious physical zone, all coherent luxurious lived-in teal-green and deep blue palette with rich terracotta and mustard accents, realistic afternoon sunlight, photographic architectural interiors, detailed tactile textures. Top left: airy glass greenhouse, dark teal steel windows, wooden potting shelves behind, central foreground long EMPTY wooden potting table surface, distant greenery only. Top right: sunlit outdoor balcony, teal railings, warm stone, city forest view, empty foreground terracotta tiled planting ledge. Bottom left: intimate reading corner with indigo armchair, mustard linen throw, bookcase, teal wall, empty wide foreground wood console. Bottom right: calm creative workspace with teal walls, walnut desk, closed notebook and brass lamp toward back, empty foreground desk area. In EVERY quadrant leave the bottom middle foreground free and spacious for separately composited interactive potted plants. Wide aspect ratio full atlas 3:2. Each scene eye-level viewpoint looking slightly down toward foreground surface. Real photography appearance, sophisticated composition, warm light, natural shadows. No giant plant in foreground, no stylized drawing.

## Prompt final: garden-zones-v2.png

Regenerated with the integrated ImageGen tool on 09-10-2026 after visual feedback. This replacement atlas removes all background plants, furniture, decor and exterior landscape. Each of the four equal panels remains a different interior architecture zone, with clear floor/wall/ceiling structure and diffuse natural light.

Use case: photorealistic-natural. One single wide photographic atlas with EXACTLY four equal rectangular photographs in a seamless 2 by 2 grid, no gutters and no borders. Each quadrant is a spacious, believable interior zone: (1) greenhouse room with dark teal steel glazing and translucent glass roof; (2) enclosed balcony room with teal painted interior wall and frosted glass; (3) reading alcove with deep blue-green plaster walls and a tall softly diffused interior window; (4) quiet work room with blue-green walls and an architectural window recess. Distinguish zones through room architecture and natural light only. Each image clearly shows interior architecture: visible floor plane, wall surfaces, ceiling or overhead structure, credible windows and natural daylight. Windows reveal only diffuse light, with no exterior view. Human eye-level camera looking slightly down enough to see a broad continuous empty floor in the lower half; architecture fills each frame. High-end photorealistic interior photography, tactile plaster, stone, timber and dark teal metal, soft natural interior daylight and realistic gentle shadows. Sophisticated green-blue and deep teal architecture with restrained warm timber and stone. Absolutely no plants, greenery, trees, plant images, pots, or reflections of vegetation anywhere. Absolutely no furniture or movable/decorative objects: no chairs, desks, tables, shelves, lamps, books, rugs, art, decor, or accessories. Rooms genuinely empty for user-created potted plants to be composited later. No people, text, watermark, UI, landscape, garden, horizon, sunset, veranda, or exterior-dominated view. Precisely four equal scenes and no fifth panel.

## Prompts finales: cactus.png, jade.png y succulent.png

Cada prompt comienza con este texto común, seguido de la variante correspondiente:

A single photorealistic potted plant cutout asset for a serene photographic greenhouse application. ONLY ONE plant, no other plants, no other objects, no text, no ground, no floor, genuine transparent alpha background. Warm afternoon sunlight from upper left, detailed realistic botanical textures and ceramic texture. The entire plant and pot must fit with ample transparent margins on every side, especially clear space at bottom. Centered plant, pot base at 92 percent height, portrait 2:3 canvas, professional botanical product photography.

- `cactus.png`: One mature columnar green cactus with two branching arms, natural ribs and small thorns, in a matte rounded burnt orange terracotta pot.
- `jade.png`: One lush jade plant with rounded waxy deep green leaves and woody stems, in a rounded glazed deep turquoise ceramic pot.
- `succulent.png`: One echeveria green succulent rosette cluster in a rounded rich mustard yellow ceramic pot.

## Prompts finales: `seed-under-soil.png` y `seedling-cotyledons.png`

Generados con ImageGen integrado el 09-10-2026, con fondo transparente y para superponer sobre las macetas ya existentes.

- `seed-under-soil.png`: “Photorealistic botanical cutaway asset on genuine transparent background. A compact horizontal wedge of rich dark potting substrate with a single viable brown seed clearly below the surface, beginning to split, and a short white radicle pointing downward inside the soil. No emerged shoot, pot, container, ground, extra seed or decorative elements. Designed to layer over the opening of an existing family-colored pot.”
- `seedling-cotyledons.png`: “Photorealistic botanical cutout on genuine transparent background. A newly germinated dicot only a few centimeters tall: a short naturally curved green hypocotyl, two small opposite rounded cotyledons with veins, a tiny first true leaf bud and a split brown seed coat attached low on the stem. Compact and proportionate, never a long bare stick. No pot, soil, roots, ground, background glow, text or extra plants. Designed to composite above existing potting soil.”

## Etapas conectadas al crecimiento

La semilla bajo el sustrato corresponde a 0 cuidados; el brote pequeño inicia con el primer cuidado y crece durante los niveles actuales. Al alcanzar 21 cuidados (nivel 4) se revela la planta adulta existente. La imagen del macetero se reutiliza recortando el follaje en las etapas tempranas; no se crean ilustraciones de especies nuevas.

## Variantes de macetero mayor

Generadas con ImageGen integrado el 09-10-2026 mediante edición individual de cada recorte original. Las tres variantes miden 1024×1536 en RGBA y tienen alpha 0 en la esquina. Se conservó la especie, forma, escala, ángulo, luz y encuadre; solo se reemplazó el macetero por otro del mismo material y color, aproximadamente 30% más ancho, con sustrato visible y fondo alfa transparente.

- `cactus-repotted.png`: editó `cactus.png`; macetero mayor de terracota rojo anaranjado.
- `jade-repotted.png`: editó `jade.png`; macetero mayor de cerámica esmaltada turquesa.
- `succulent-repotted.png`: editó `succulent.png`; macetero mayor de cerámica esmaltada ocre.

El hito aparece al alcanzar el nivel 5 existente (28 puntos de crecimiento), un nivel después de la etapa visual establecida en el nivel 4. La imagen no cambia hasta que la persona elige `Trasplantar ahora`; `potStage` queda guardado en el jardín y no retrocede por pausas. Prompt común: “Edita solo la planta de referencia; conserva planta, pose, luz, textura, escala, cámara y encuadre; cambia únicamente la maceta por otra claramente más ancha del mismo material y color, mantiene visible el sustrato, cutout fotográfico entero y fondo genuinamente transparente. Sin objetos, texto, escena ni marca de agua.”
