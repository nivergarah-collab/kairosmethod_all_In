import React, { useEffect, useState } from 'react';
import { GRUPOS, TODOS_LOS_AJUSTES, ajustar, elegirPerfil, rangoDe } from './ajustes.js';
import { PERFILES, ORDEN_PERFILES } from './perfiles.js';

function Paso({ a, cfg, onCambio }) {
  const [min, max] = rangoDe(cfg, a.clave);
  const v = cfg[a.clave];
  const ayudaId = `vi-ayuda-${a.clave}`;
  return (
    <div className="vi-fila">
      <div className="vi-fila-cabecera">
        <span className="vi-etiqueta" id={`vi-et-${a.clave}`}>{a.etiqueta}</span>
        <div className="vi-paso" role="group" aria-labelledby={`vi-et-${a.clave}`} aria-describedby={ayudaId}>
          <button type="button" className="vi-btn vi-btn-paso" aria-label={`Menos ${a.etiqueta}`} disabled={v <= min} onClick={() => onCambio(ajustar(cfg, a.clave, v - 1))}>−</button>
          <output aria-live="polite">{v} <small>{a.unidad}</small></output>
          <button type="button" className="vi-btn vi-btn-paso" aria-label={`Más ${a.etiqueta}`} disabled={v >= max} onClick={() => onCambio(ajustar(cfg, a.clave, v + 1))}>+</button>
        </div>
      </div>
      <p className="vi-ayuda" id={ayudaId}>{a.ayuda} <span className="vi-rango">Permitido: {min} a {max}.</span></p>
    </div>
  );
}

function Opciones({ a, valor, nombre, onElegir }) {
  const ayudaId = `vi-ayuda-${a.clave}`;
  return (
    <fieldset className="vi-fila" aria-describedby={ayudaId}>
      <legend className="vi-etiqueta">{a.etiqueta}</legend>
      <div className="vi-opciones">
        {a.opciones.map((o) => (
          <label key={String(o.valor)} className="vi-opcion">
            <input type="radio" name={`vi-${nombre}`} checked={valor === o.valor} onChange={() => onElegir(o.valor)} />
            <span>{o.texto}</span>
          </label>
        ))}
      </div>
      <p className="vi-ayuda" id={ayudaId}>{a.ayuda}</p>
    </fieldset>
  );
}

function Interruptor({ a, cfg, onCambio }) {
  const ayudaId = `vi-ayuda-${a.clave}`;
  return (
    <div className="vi-fila">
      <label className="vi-fila-cabecera vi-interruptor">
        <span className="vi-etiqueta">{a.etiqueta}</span>
        <input type="checkbox" role="switch" checked={cfg[a.clave]} aria-describedby={ayudaId} onChange={(e) => onCambio(ajustar(cfg, a.clave, e.target.checked))} />
      </label>
      <p className="vi-ayuda" id={ayudaId}>{a.ayuda}</p>
    </div>
  );
}

// Borra los ajustes guardados de esta visión: pide un segundo toque seguido. Esc, tocar otra cosa o mover el foco lo cancelan.
function Restablecer({ onRestablecer }) {
  const [confirma, setConfirma] = useState(false);
  useEffect(() => {
    if (!confirma) return undefined;
    const fuera = (e) => { if (!(e.target?.closest && e.target.closest('[data-restablecer]'))) setConfirma(false); };
    const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setConfirma(false); } };
    document.addEventListener('pointerdown', fuera, true);
    document.addEventListener('focusin', fuera, true);
    document.addEventListener('keydown', tecla, true);
    return () => {
      document.removeEventListener('pointerdown', fuera, true);
      document.removeEventListener('focusin', fuera, true);
      document.removeEventListener('keydown', tecla, true);
    };
  }, [confirma]);
  const pulsar = () => { if (!confirma) { setConfirma(true); return; } setConfirma(false); onRestablecer(); };
  return (
    <>
      <button type="button" className="vi-btn" data-restablecer="1" aria-describedby="vi-ayuda-restablecer" onClick={pulsar}>{confirma ? 'Confirmar: restablecer' : 'Restablecer ajustes'}</button>
      <p className="vi-ayuda" id="vi-ayuda-restablecer">Vuelve al perfil Libre y borra lo guardado de esta pantalla en este dispositivo. Pide confirmar con un segundo toque.</p>
      <p className="vi-ayuda" role="status">{confirma ? 'Para restablecer, pulsa «Confirmar: restablecer». Esc o tocar otra cosa lo cancela.' : ''}</p>
    </>
  );
}

const TEMA = {
  clave: 'tema',
  etiqueta: 'Colores',
  ayuda: 'Cambia los colores de toda la app: claros, oscuros o los del dispositivo (con más contraste si el dispositivo lo pide).',
  opciones: [{ valor: 'sistema', texto: 'Del dispositivo' }, { valor: 'claro', texto: 'Claros' }, { valor: 'oscuro', texto: 'Oscuros' }],
};

export function Ajustes({ resumen, cfg, tema, onTema, onCambio, onRestablecer, onVolver }) {
  return (
    <div className="vi-pantalla">
      <div className="vi-barra">
        <h1 id="vi-t-ajustes" tabIndex={-1}>Ajustes</h1>
        <button type="button" className="vi-btn vi-btn-volver" onClick={onVolver}>← Volver</button>
      </div>
      {resumen && (
        <div className="vi-sesion-aparte">
          <div role="status" aria-live="polite">
            <p><strong>Sesión:</strong> {resumen.etiqueta}</p>
            {resumen.texto && <p className="vi-sesion-aparte-texto">{resumen.texto}</p>}
          </div>
          {resumen.tiempo && <p className="vi-sesion-aparte-tiempo" aria-hidden="true">{resumen.tiempo}</p>}
        </div>
      )}
      <nav className="vi-indice" aria-label="Secciones de Ajustes">
        <a href="#vi-g-perfil">Perfil</a>
        {GRUPOS.map((g) => <a key={g.id} href={`#vi-g-${g.id}`}>{g.titulo}</a>)}
        <a href="#vi-g-datos">Datos</a>
        <a href="#vi-g-acerca">Acerca de</a>
      </nav>
      <p className="vi-nota">Los tiempos de enfoque y descanso, el sonido y la vibración se eligen en Configurar. Aquí se ajusta cómo se ve y avanza esta pantalla.</p>

      <section className="vi-grupo" aria-labelledby="vi-g-perfil">
        <h2 id="vi-g-perfil">Perfil</h2>
        <fieldset className="vi-fila" aria-describedby="vi-ayuda-perfil">
          <legend className="vi-etiqueta">Punto de partida</legend>
          <div className="vi-perfiles">
            {ORDEN_PERFILES.map((id) => (
              <label key={id} className={`vi-perfil ${cfg.perfil === id ? 'vi-activo' : ''}`}>
                <input type="radio" name="vi-perfil" checked={cfg.perfil === id} onChange={() => onCambio(elegirPerfil(id))} />
                <span className="vi-perfil-nombre">{PERFILES[id].nombre}</span>
                <span className="vi-perfil-resumen">{PERFILES[id].resumen}</span>
              </label>
            ))}
          </div>
          <p className="vi-ayuda" id="vi-ayuda-perfil">Elegir un perfil cambia todos los ajustes de una vez; después puedes modificar cualquiera.</p>
        </fieldset>
      </section>

      {GRUPOS.map((g) => (
        <section className="vi-grupo" key={g.id} aria-labelledby={`vi-g-${g.id}`}>
          <h2 id={`vi-g-${g.id}`}>{g.titulo}</h2>
          {g.ajustes.map((a) => (a.tipo === 'numero'
            ? <Paso key={a.clave} a={a} cfg={cfg} onCambio={onCambio} />
            : a.tipo === 'opciones'
              ? <Opciones key={a.clave} a={a} nombre={a.clave} valor={cfg[a.clave]} onElegir={(v) => onCambio(ajustar(cfg, a.clave, v))} />
              : <Interruptor key={a.clave} a={a} cfg={cfg} onCambio={onCambio} />))}
          {g.id === 'pantalla' && <Opciones a={TEMA} nombre="tema" valor={tema} onElegir={onTema} />}
        </section>
      ))}

      <section className="vi-grupo" aria-labelledby="vi-g-datos">
        <h2 id="vi-g-datos">Datos</h2>
        <div className="vi-fila"><Restablecer onRestablecer={onRestablecer} /></div>
      </section>

      <section className="vi-grupo" aria-labelledby="vi-g-acerca">
        <h2 id="vi-g-acerca">Acerca de</h2>
        <p>Esta pantalla organiza tu estudio en bloques de enfoque y descansos. Tú eliges los avisos y cuándo empieza cada fase.</p>
        <p>Privacidad: todo se guarda solo en este dispositivo. No hay cuentas ni se envían datos.</p>
        <h3>Atajos de teclado</h3>
        <ul className="vi-atajos">
          <li><kbd>Espacio</kbd> empezar, pausar o continuar</li>
          <li><kbd>M</kbd> sumar tiempo a la fase</li>
          <li><kbd>S</kbd> saltar a la fase siguiente</li>
          <li><kbd>Esc</kbd> volver desde Ajustes</li>
        </ul>
      </section>
    </div>
  );
}
