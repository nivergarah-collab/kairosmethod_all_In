import { useState } from 'react';
import { FAMILIES } from '../state.js';
import { HelpButton } from '../tutorial/HelpButton.jsx';

export function PlantForm({ onSave, onCancel, onHelp }) {
  const [familyId, setFamilyId] = useState(FAMILIES[0].id);
  const family = FAMILIES.find(({ id }) => id === familyId);
  const [form, setForm] = useState({
    approachId: family.approaches[0].id,
    name: '', action: '', frequency: 'daily', moment: '', place: '',
  });
  const update = ({ currentTarget: { name, value } }) => setForm((current) => ({ ...current, [name]: value }));
  const changeFamily = ({ currentTarget: { value } }) => {
    const nextFamily = FAMILIES.find(({ id }) => id === value);
    setFamilyId(value);
    setForm((current) => ({ ...current, approachId: nextFamily.approaches[0].id }));
  };
  const submit = (event) => {
    event.preventDefault();
    onSave({ ...form, familyId, cue: { moment: form.moment, place: form.place } });
  };

  return (
    <main className="garden-shell feature-page" id="garden-top" aria-labelledby="plant-form-title">
      <FeatureMasthead onCancel={onCancel} onHelp={onHelp} backLabel="Volver al jardín" />
      <section className="feature-card" data-tour="plant-form">
        <p className="eyebrow">Una semilla nueva</p>
        <h1 id="plant-form-title">Crea una microacción</h1>
        <p>Elige algo pequeño, claro y fácil de repetir.</p>
        <form className="plant-edit-form" onSubmit={submit}>
          <label>Familia
            <select value={familyId} onChange={changeFamily}>{FAMILIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
          </label>
          <label>Enfoque
            <select name="approachId" value={form.approachId} onChange={update}>{family.approaches.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
          </label>
          <label>Nombre de la planta<input name="name" value={form.name} onChange={update} maxLength={60} required /></label>
          <label>Mi microacción<textarea name="action" value={form.action} onChange={update} maxLength={240} rows={3} placeholder="Por ejemplo: resolver un ejercicio sin mirar el ejemplo." required /></label>
          <label>Frecuencia<select name="frequency" value={form.frequency} onChange={update}><option value="daily">Cada día</option><option value="weekly">Cada semana</option></select></label>
          <div className="context-fields">
            <label>Después de…<input name="moment" value={form.moment} onChange={update} maxLength={100} /></label>
            <label>En…<input name="place" value={form.place} onChange={update} maxLength={100} /></label>
          </div>
          <div className="detail-actions">
            <button type="button" className="button button-quiet" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="button button-primary">Plantar semilla</button>
          </div>
        </form>
      </section>
    </main>
  );
}

function FeatureMasthead({ onCancel, onHelp, backLabel }) {
  return <header className="site-masthead"><a className="wordmark" href="#garden-top"><span className="wordmark-mark" aria-hidden="true">✳</span><span>jardín <strong>kaizen</strong></span></a><div className="masthead-actions"><HelpButton onClick={onHelp} /><button className="button button-quiet" type="button" onClick={onCancel}>{backLabel}</button></div></header>;
}
