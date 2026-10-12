import { FAMILIES } from '../state.js';

function PlantIllustration({ familyId, level }) {
  const leafCount = Math.min(5, Math.max(2, level + 1));
  const leaves = Array.from({ length: leafCount }, (_, index) => {
    const x = 34 + (index % 2) * 22 + Math.floor(index / 2) * 8;
    const y = 67 - index * 7;
    const rotate = index % 2 === 0 ? -35 : 35;
    return <ellipse key={index} cx={x} cy={y} rx="11" ry="19" transform={`rotate(${rotate} ${x} ${y})`} />;
  });

  return (
    <svg className={`plant-illustration plant-art--${familyId}`} viewBox="0 0 100 112" aria-hidden="true" focusable="false">
      <path className="plant-stem" d="M50 82V38" />
      <g className="plant-leaves">{leaves}</g>
      <path className="plant-pot" d="M26 78h48l-5 27H31z" />
      <path className="plant-pot-rim" d="M23 75h54v8H23z" />
      <path className="plant-soil" d="M29 78h42" />
    </svg>
  );
}

export function PlantCard({ plant, dayKey, onCare, onOpen }) {
  const family = FAMILIES.find(({ id }) => id === plant.familyId);
  const approach = family.approaches.find(({ id }) => id === plant.approachId);
  const caredToday = plant.lastCareDay === dayKey;
  const context = [plant.cue.moment, plant.cue.place].filter(Boolean).join(' · ');

  return (
    <article className={`plant-card family--${family.id} ${caredToday ? 'is-cared' : ''}`}>
      <div className="plant-art-wrap"><PlantIllustration familyId={family.id} level={plant.level} /></div>
      <div className="plant-card-content">
        <div className="plant-card-heading">
          <div>
            <p className="plant-kicker">{approach.label} · Nivel {plant.level}</p>
            <h3>{plant.name}</h3>
          </div>
          <span className={`care-state ${caredToday ? 'is-done' : ''}`} aria-label={caredToday ? 'Cuidado de hoy completo' : 'Aún no cuidada hoy'}>
            {caredToday ? '●' : '○'}
          </span>
        </div>
        <p className="plant-action">{plant.action}</p>
        <p className={`plant-context ${context ? '' : 'is-empty'}`}>
          {context || 'Añade un momento y lugar para recordar tu señal.'}
        </p>
        <div className="plant-progress-row">
          <div className="health-meter" role="progressbar" aria-label={`Vitalidad de ${plant.name}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={plant.health}>
            <span style={{ width: `${plant.health}%` }} />
          </div>
          <span className="health-label">Vitalidad {plant.health}%</span>
        </div>
        <div className="plant-card-bottom">
          <span className="growth-count"><span aria-hidden="true">✦</span> {plant.growthPoints} cuidados</span>
          <div className="plant-actions">
            <button type="button" className="button button-care" onClick={() => onCare(plant.id)} disabled={caredToday}>
              {caredToday ? 'Cuidada hoy' : 'Cuidar hoy'}
            </button>
            <button type="button" className="button button-link" onClick={() => onOpen(plant.id)} aria-label={`Ver detalles de ${plant.name}`}>
              Detalles
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
