import { canUnlockNursery, FAMILIES } from '../state.js';
import { HelpButton } from '../tutorial/HelpButton.jsx';

const SEEDS = [
  { familyId: 'comprender', approachId: 'comparar', name: 'Conectar dos ideas', action: 'Anotar una conexión entre lo que estudio hoy y algo que ya conozco.', frequency: 'daily', cue: { moment: '', place: '' } },
  { familyId: 'practicar', approachId: 'corregir', name: 'Practicar con intención', action: 'Revisar un error y probar de nuevo con una sola corrección.', frequency: 'daily', cue: { moment: '', place: '' } },
];

export function Nursery({ garden, onHelp, onBack, onCreate, onSimulateWeek }) {
  const unlocked = canUnlockNursery(garden);
  return (
    <main className="garden-shell feature-page" id="garden-top" aria-labelledby="nursery-title">
      <header className="site-masthead"><a className="wordmark" href="#garden-top"><span className="wordmark-mark" aria-hidden="true">✳</span><span>jardín <strong>kaizen</strong></span></a><div className="masthead-actions"><HelpButton onClick={onHelp} /><button className="button button-quiet" type="button" onClick={onBack}>Volver al jardín</button></div></header>
      <section className="feature-card wide-card" data-tour="nursery">
        <p className="eyebrow">Semillas para más adelante</p><h1 id="nursery-title">Vivero</h1>
        <p>Una semana cuidando todas tus plantas abre dos nuevas semillas. Es una regla provisional de esta demo.</p>
        <p className={`nursery-status ${unlocked ? 'is-unlocked' : ''}`} role="status">{unlocked ? 'Las dos semillas están listas para plantar.' : 'Aún están cerradas. Puedes simular una semana saludable en modo demo.'}</p>
        {!unlocked && <button className="button button-primary" type="button" onClick={onSimulateWeek}>Simular semana saludable</button>}
        <div className="nursery-seeds">{SEEDS.map((seed, index) => {
          const family = FAMILIES.find(({ id }) => id === seed.familyId);
          const approach = family.approaches.find(({ id }) => id === seed.approachId);
          return <article className={`nursery-seed family--${family.id} ${unlocked ? '' : 'is-locked'}`} key={seed.name}>
            <span className="nursery-seed-icon" aria-hidden="true">{unlocked ? '✳' : '◌'}</span><p className="plant-kicker">Semilla 0{index + 1} · {family.label}</p><h2>{seed.name}</h2><p>{seed.action}</p><small>{approach.label} · {unlocked ? 'Disponible' : 'Bloqueada'}</small>
            <button type="button" className="button button-primary" disabled={!unlocked} onClick={() => onCreate(seed)}>Plantar</button>
          </article>;
        })}</div>
      </section>
    </main>
  );
}
