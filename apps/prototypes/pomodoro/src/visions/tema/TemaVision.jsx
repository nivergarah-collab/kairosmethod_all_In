import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useVM, useEffectiveDark } from '../../useStore.jsx';
import { safeLocalStorage } from '../../storage.js';
import { PREDETERMINADA, cargarPaletaVision, guardarPaletaVision, muestraDe, paletasDe, varsDePaleta } from './paletasVision.js';
import './tema.css';

const TEMAS = [{ valor: 'sistema', texto: 'Del dispositivo' }, { valor: 'claro', texto: 'Claro' }, { valor: 'oscuro', texto: 'Oscuro' }];

function Panel({ visionId, paleta, onPaleta, oscuro, abierto, setAbierto }) {
  const { state, vm } = useVM();
  const uid = useId();
  const boton = useRef(null);
  const tema = state.isDarkTheme === null ? 'sistema' : state.isDarkTheme ? 'oscuro' : 'claro';
  const opciones = [{ id: PREDETERMINADA, nombre: 'Predeterminada', descripcion: 'El aspecto original de esta pantalla.' }, ...paletasDe(visionId)];

  useEffect(() => {
    if (!abierto) return undefined;
    const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setAbierto(false); boton.current?.focus(); } };
    document.addEventListener('keydown', tecla, true);
    return () => document.removeEventListener('keydown', tecla, true);
  }, [abierto, setAbierto]);

  return (
    <div className="vt" data-testid="vision_tema">
      <button ref={boton} type="button" className="vt-boton" aria-expanded={abierto} aria-controls={`${uid}-panel`} onClick={() => setAbierto(!abierto)}>Colores<svg className={`vt-flecha${abierto ? ' vt-abierta' : ''}`} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
      {abierto && (
        <div id={`${uid}-panel`} className="vt-panel" role="group" aria-label="Colores de esta pantalla">
          <div className="vt-grupo" role="radiogroup" aria-labelledby={`${uid}-tema`}>
            <p id={`${uid}-tema`} className="vt-titulo">Tema</p>
            <div className="vt-fila">
              {TEMAS.map((t) => (
                <label key={t.valor} className={`vt-opcion${tema === t.valor ? ' vt-activa' : ''}`}>
                  <input type="radio" name={`${uid}-tema`} checked={tema === t.valor} onChange={() => vm.setDarkTheme(t.valor === 'sistema' ? null : t.valor === 'oscuro')} />
                  <span>{t.texto}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="vt-grupo" role="radiogroup" aria-labelledby={`${uid}-pal`} aria-describedby={`${uid}-ayuda`}>
            <p id={`${uid}-pal`} className="vt-titulo">Paleta sugerida</p>
            <p id={`${uid}-ayuda`} className="vt-ayuda">Solo cambia los colores de esta pantalla, no los del resto de la app.</p>
            <div className="vt-lista">
              {opciones.map((p) => {
                const m = muestraDe(visionId, p.id, oscuro);
                return (
                  <label key={p.id} className={`vt-paleta${paleta === p.id ? ' vt-activa' : ''}`} data-testid={`vision_palette_${p.id}`}>
                    <input type="radio" name={`${uid}-pal`} checked={paleta === p.id} onChange={() => onPaleta(p.id)} />
                    {m && <span className="vt-muestras" aria-hidden="true">{m.map((c, i) => <span key={i} style={{ background: c }} />)}</span>}
                    <span className="vt-texto"><strong>{p.nombre}</strong><small>{p.descripcion}</small></span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Colores propios de una visión: claro/oscuro (el tema de la app) y las paletas que sugiere esa visión.
 * Devuelve `vars` (variables CSS para el contenedor raíz de la visión, que pisan las suyas) y `panel`
 * (el botón «Colores» con su panel, para ponerlo dentro de la visión). La paleta se recuerda por visión.
 */
export function useTemaVision(visionId) {
  const oscuro = useEffectiveDark();
  const [paleta, setPaleta] = useState(() => cargarPaletaVision(safeLocalStorage(), visionId));
  const [abierto, setAbierto] = useState(false);
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    guardarPaletaVision(safeLocalStorage(), visionId, paleta);
  }, [visionId, paleta]);
  const vars = useMemo(() => varsDePaleta(visionId, paleta, oscuro), [visionId, paleta, oscuro]);
  const panel = <Panel visionId={visionId} paleta={paleta} onPaleta={setPaleta} oscuro={oscuro} abierto={abierto} setAbierto={setAbierto} />;
  return { vars, panel, paleta };
}
