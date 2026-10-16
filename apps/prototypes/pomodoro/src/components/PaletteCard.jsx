import React from 'react';
import { useVM, useEffectiveDark } from '../useStore.jsx';
import { T } from '../m3.jsx';
import { PALETAS } from '../palettes.js';
import { Plegable } from './Plegable.jsx';
import './palette-card.css';

/** Selector de paleta de la página principal. Plegable: empieza cerrado y muestra la paleta actual. */
export function PaletteCard() {
  const { state, vm } = useVM();
  const oscuro = useEffectiveDark();
  const actual = PALETAS.find((p) => p.id === state.palette);
  return (
    <Plegable titulo="Paleta de colores" resumen={actual?.nombre} testId="palette_card" toggleTestId="palette_toggle">
      <div className="pal-campo" role="radiogroup" aria-label="Paleta de colores" aria-describedby="pal-ayuda">
        <p id="pal-ayuda" className="pal-ayuda"><T v="bodySmall" color="var(--on-surface-variant)">Se combina con el tema claro u oscuro. Las visiones en curso pueden sugerir sus propios colores.</T></p>
        <div className="pal-lista">
          {PALETAS.map((p) => {
            const m = (oscuro ? p.oscuro : p.claro) ?? null;
            const muestra = m ? [m.background, m.surface, m.primary, m.secondary] : oscuro ? ['#0F172A', '#1E293B', '#FF8B7D', '#F59E0B'] : ['#FFFDFB', '#FFFFFF', '#D9483B', '#E28743'];
            return (
              <label key={p.id} className={`pal-opcion${state.palette === p.id ? ' pal-activa' : ''}`} data-testid={`palette_option_${p.id}`}>
                <input type="radio" name="palette" value={p.id} checked={state.palette === p.id} onChange={() => vm.setPalette(p.id)} />
                <span className="pal-muestras" aria-hidden="true">{muestra.map((c, i) => <span key={i} style={{ background: c }} />)}</span>
                <span className="pal-texto"><T v="labelLarge" w="bold">{p.nombre}</T><T v="bodySmall" color="var(--on-surface-variant)">{p.descripcion}</T></span>
              </label>
            );
          })}
        </div>
      </div>
    </Plegable>
  );
}
