import { FAMILIES, getActivePlants } from '../state.js';
import { PlantCard } from './PlantCard.jsx';
import { DemoControls } from './DemoControls.jsx';

export function GardenView({ garden, dayKey, notice, storageError, onCare, onSelectPlant, onNavigate, onDemoAction }) {
  const activePlants = getActivePlants(garden);

  return (
    <main className="garden-shell" aria-labelledby="garden-title">
      <header className="site-masthead">
        <a className="wordmark" href="#garden-top" aria-label="Jardín Kaizen, inicio">
          <span className="wordmark-mark" aria-hidden="true">✳</span>
          <span>jardín <strong>kaizen</strong></span>
        </a>
        <div className="garden-top-actions">
          <span className={`clock-chip ${garden.clockMode === 'demo' ? 'is-demo' : ''}`}>
            <span aria-hidden="true">{garden.clockMode === 'demo' ? '◷' : '◉'}</span>
            {garden.clockMode === 'demo' ? 'Modo demo' : 'Hoy'}
          </span>
          <button type="button" className="button button-quiet settings-button" onClick={() => onNavigate('plant-form')}>Nueva planta</button>
          <button type="button" className="button button-quiet settings-button" onClick={() => onNavigate('nursery')}>Vivero</button>
          <button type="button" className="button button-quiet settings-button" onClick={() => onNavigate('herbarium')}>Herbario</button>
          <button type="button" className="button button-quiet settings-button" onClick={() => onNavigate('settings')}>Ajustes</button>
        </div>
      </header>

      <section className="garden-hero" id="garden-top">
        <div>
          <p className="eyebrow">Tu espacio de aprendizaje</p>
          <h1 id="garden-title">Crecer también es volver</h1>
          <p className="garden-subtitle">Un cuidado pequeño hoy deja sitio para el siguiente.</p>
        </div>
        <div className="garden-summary" aria-label={`${activePlants.length} plantas activas`}>
          <span className="summary-number">{activePlants.length}</span>
          <span>plantas<br />en tu jardín</span>
        </div>
      </section>

      {notice && <p className="garden-notice" role="status" aria-live="polite">{notice}</p>}
      {storageError && <p className="inline-error" role="alert">No se pudo guardar en este navegador. Tus cambios siguen en pantalla.</p>}
      <DemoControls garden={garden} dayKey={dayKey} onAction={onDemoAction} />

      <div className="garden-intro-row">
        <div><span className="garden-line" aria-hidden="true" /><span>El jardín de hoy</span></div>
        <span className="garden-date">{new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(new Date(`${dayKey}T12:00:00`))}</span>
      </div>

      {activePlants.length === 0 ? (
        <section className="empty-garden" aria-labelledby="empty-garden-title">
          <span className="empty-seed" aria-hidden="true">✳</span>
          <h2 id="empty-garden-title">Tu jardín tiene espacio para otra historia</h2>
          <p>Las plantas que congelas quedan guardadas en el herbario.</p>
        </section>
      ) : (
        <div className="garden-landscape">
          {FAMILIES.map((family, index) => {
            const plants = activePlants.filter(({ familyId }) => familyId === family.id);
            return (
              <section className={`garden-bed family--${family.id}`} key={family.id} aria-labelledby={`family-title-${family.id}`}>
                <div className="bed-marker" aria-hidden="true"><span>0{index + 1}</span></div>
                <header className="bed-heading">
                  <div>
                    <p className="eyebrow">Zona {index + 1}</p>
                    <h2 id={`family-title-${family.id}`}>{family.label}</h2>
                  </div>
                  <p>{family.description}</p>
                </header>
                {plants.length > 0 ? (
                  <div className="plant-list">
                    {plants.map((plant) => (
                      <PlantCard key={plant.id} plant={plant} dayKey={dayKey} onCare={onCare} onOpen={onSelectPlant} />
                    ))}
                  </div>
                ) : (
                  <p className="bed-empty">Aquí puede crecer una nueva semilla.</p>
                )}
              </section>
            );
          })}
        </div>
      )}
      <footer className="garden-footer">
        <span aria-hidden="true">✳</span>
        <p>Un día a la vez. Una planta a la vez.</p>
        <span>{activePlants.length} {activePlants.length === 1 ? 'planta activa' : 'plantas activas'}</span>
      </footer>
    </main>
  );
}
