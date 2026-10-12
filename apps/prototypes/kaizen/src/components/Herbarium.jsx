import { useState } from 'react';
import { FAMILIES } from '../state.js';
import { HelpButton } from '../tutorial/HelpButton.jsx';

export function Herbarium({ plants, onHelp, onBack, onReplicate, onDelete }) {
  const [deletingId, setDeletingId] = useState(null);
  return (
    <main className="garden-shell feature-page" id="garden-top" aria-labelledby="herbarium-title">
      <header className="site-masthead"><a className="wordmark" href="#garden-top"><span className="wordmark-mark" aria-hidden="true">✳</span><span>jardín <strong>kaizen</strong></span></a><div className="masthead-actions"><HelpButton onClick={onHelp} /><button className="button button-quiet" type="button" onClick={onBack}>Volver al jardín</button></div></header>
      <section className="feature-card wide-card" data-tour="herbarium">
        <p className="eyebrow">Memoria de lo vivido</p><h1 id="herbarium-title">Herbario</h1>
        <p>Las plantas congeladas conservan su recorrido, salud e historial.</p>
        {plants.length === 0 ? <p className="feature-empty">Aún no hay plantas en el herbario. Desde los detalles puedes congelar una sin perder su historia.</p> : (
          <ul className="herbarium-list">{plants.slice().reverse().map((plant) => {
            const family = FAMILIES.find(({ id }) => id === plant.familyId);
            const approach = family.approaches.find(({ id }) => id === plant.approachId);
            return <li className={`herbarium-item family--${family.id}`} key={plant.id}>
              <div><p className="plant-kicker">{family.label} · {approach.label}</p><h2>{plant.name}</h2><p>{plant.action}</p><small>{plant.growthPoints} cuidados · Nivel {plant.level} · Vitalidad {plant.health}%</small></div>
              <div className="herbarium-actions">{deletingId === plant.id ? <><span role="status">¿Eliminar definitivamente?</span><button className="button button-quiet" type="button" onClick={() => setDeletingId(null)}>Cancelar</button><button className="button button-outline-danger" type="button" onClick={() => { onDelete(plant); setDeletingId(null); }}>Confirmar</button></> : <><button className="button button-quiet" type="button" onClick={() => onReplicate(plant)}>Replicar</button><button className="button button-outline-danger" type="button" onClick={() => setDeletingId(plant.id)}>Eliminar</button></>}</div>
            </li>;
          })}</ul>
        )}
      </section>
    </main>
  );
}
