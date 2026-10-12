import { useState } from 'react';
import { FAMILIES } from '../state.js';

export function StarterSelection({ existingPlants = [], storageError = false, onFinish }) {
  const [activeIndex, setActiveIndex] = useState(() => {
    const firstUnselected = FAMILIES.findIndex((family) => !existingPlants.some((plant) => plant.familyId === family.id));
    return firstUnselected < 0 ? 0 : firstUnselected;
  });
  const [selected, setSelected] = useState(() => Object.fromEntries(
    existingPlants.map(({ familyId, approachId }) => [familyId, approachId]),
  ));
  const family = FAMILIES[activeIndex];
  const selectedApproach = selected[family.id];
  const allSelected = FAMILIES.every(({ id }) => selected[id]);

  const chooseApproach = (approachId) => {
    setSelected((current) => ({ ...current, [family.id]: approachId }));
  };

  const continueFlow = () => {
    if (!selectedApproach) return;
    if (activeIndex < FAMILIES.length - 1) setActiveIndex((index) => index + 1);
    else if (allSelected) onFinish(selected);
  };

  return (
    <main className="onboarding-shell" aria-labelledby="onboarding-title">
      <header className="site-masthead">
        <a className="wordmark" href="#inicio" aria-label="Jardín Kaizen, inicio">
          <span className="wordmark-mark" aria-hidden="true">✳</span>
          <span>jardín <strong>kaizen</strong></span>
        </a>
        <span className="masthead-note">Un paso pequeño, cada día</span>
      </header>

      <section className="onboarding-card" id="inicio">
        <div className="onboarding-intro">
          <p className="eyebrow">Tu jardín comienza aquí</p>
          <h1 id="onboarding-title">Elige cómo quieres aprender</h1>
          <p>Escoge una semilla por familia. Puedes cambiar el ritmo y la acción después.</p>
        </div>

        <ol className="onboarding-steps" aria-label="Progreso del inicio">
          {FAMILIES.map((item, index) => (
            <li key={item.id} className={index === activeIndex ? 'is-current' : selected[item.id] ? 'is-complete' : ''}>
              <span className="step-number" aria-hidden="true">{selected[item.id] ? '✓' : `0${index + 1}`}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ol>

        <div className={`family-prompt family--${family.id}`}>
          <div className="family-number" aria-hidden="true">0{activeIndex + 1}</div>
          <div>
            <p className="eyebrow">Familia {activeIndex + 1} de {FAMILIES.length}</p>
            <h2>{family.label}</h2>
            <p>{family.description}</p>
          </div>
        </div>

        <fieldset className="approach-fieldset">
          <legend>¿Qué te gustaría probar?</legend>
          <div className="approach-grid">
            {family.approaches.map((approach, index) => {
              const isSelected = selectedApproach === approach.id;
              return (
                <button
                  className={`approach-choice ${isSelected ? 'is-selected' : ''}`}
                  type="button"
                  key={approach.id}
                  aria-pressed={isSelected}
                  onClick={() => chooseApproach(approach.id)}
                >
                  <span className={`approach-seed seed-${index + 1}`} aria-hidden="true">
                    <span />
                  </span>
                  <span className="approach-copy">
                    <strong>{approach.label}</strong>
                    <span>{approach.starterAction}</span>
                  </span>
                  <span className="choice-indicator" aria-hidden="true">{isSelected ? '✓' : '+'}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {storageError && <p className="inline-error" role="alert">Este navegador no pudo guardar el jardín localmente.</p>}

        <div className="onboarding-actions">
          <button
            type="button"
            className="button button-quiet"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
          >
            Volver
          </button>
          <span className="selection-hint" aria-live="polite">
            {selectedApproach ? `Elegiste ${family.approaches.find(({ id }) => id === selectedApproach).label}` : 'Elige una semilla para continuar'}
          </span>
          <button type="button" className="button button-primary" disabled={!selectedApproach || (activeIndex === 2 && !allSelected)} onClick={continueFlow}>
            {activeIndex === FAMILIES.length - 1 ? 'Entrar al jardín' : 'Siguiente familia'}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
      <footer className="page-footer">Tus hábitos son tuyos. El jardín se guarda en este dispositivo.</footer>
    </main>
  );
}
