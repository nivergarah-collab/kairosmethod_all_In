import { useEffect, useRef, useState } from 'react';
import { FAMILIES } from '../state.js';

function formatDate(value) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(date);
}

function historyDate(event) {
  return event.dayKey ? `${event.dayKey}T12:00:00` : event.at;
}

function historyLabel(event) {
  if (event.type === 'care') return 'Cuidado completado';
  if (event.type === 'miss') return 'Día de pausa';
  if (event.type === 'reflection') return 'Reflexión';
  return 'Actividad';
}

export function PlantDetail({ plant, dayKey, now = new Date(), dispatch, onClose }) {
  const family = FAMILIES.find(({ id }) => id === plant.familyId);
  const approach = family.approaches.find(({ id }) => id === plant.approachId);
  const [editing, setEditing] = useState(false);
  const [confirmFreeze, setConfirmFreeze] = useState(false);
  const [form, setForm] = useState({
    name: plant.name,
    action: plant.action,
    frequency: plant.frequency,
    moment: plant.cue.moment,
    place: plant.cue.place,
  });
  const [error, setError] = useState('');
  const closeButtonRef = useRef(null);
  const firstConfirmRef = useRef(null);
  const cancelConfirmRef = useRef(null);
  const freezeButtonRef = useRef(null);
  const wasConfirming = useRef(false);
  const events = plant.history.slice(-8).reverse();

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();
    return () => previousFocus?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (confirmFreeze) setConfirmFreeze(false);
        else onClose();
      }
      if (event.key === 'Tab') {
        const dialog = event.currentTarget;
        const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])')];
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const dialog = document.querySelector('[data-plant-detail]');
    dialog?.addEventListener('keydown', onKeyDown);
    return () => {
      dialog?.removeEventListener('keydown', onKeyDown);
    };
  }, [confirmFreeze, onClose]);

  useEffect(() => {
    if (confirmFreeze) {
      wasConfirming.current = true;
      cancelConfirmRef.current?.focus();
    } else if (wasConfirming.current) {
      wasConfirming.current = false;
      freezeButtonRef.current?.focus();
    }
  }, [confirmFreeze]);

  const updateField = (event) => {
    const { name, value } = event.currentTarget;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveEdits = (event) => {
    event.preventDefault();
    try {
      dispatch({
        type: 'EDIT_PLANT',
        plantId: plant.id,
        changes: {
          name: form.name,
          action: form.action,
          frequency: form.frequency,
          cue: { moment: form.moment, place: form.place },
        },
        now,
      });
      setError('');
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar los cambios.');
    }
  };

  const freezePlant = () => {
    dispatch({ type: 'FREEZE_PLANT', plantId: plant.id, now });
    onClose();
  };

  return (
    <div className="detail-backdrop" onMouseDown={(event) => { if (!confirmFreeze && event.target === event.currentTarget) onClose(); }}>
      <section className="plant-detail" role={confirmFreeze ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={confirmFreeze ? 'freeze-confirm-title' : 'plant-detail-title'} data-plant-detail tabIndex={-1}>
        <button className="detail-close" type="button" onClick={onClose} ref={closeButtonRef} aria-label="Cerrar detalles">×</button>
        {confirmFreeze ? (
          <>
            <p className="eyebrow">Guardar en el herbario</p>
            <h2 id="freeze-confirm-title">¿Congelar esta planta?</h2>
            <p>Su historial y crecimiento quedarán guardados en el herbario.</p>
            <div className="detail-actions">
              <button type="button" className="button button-quiet" ref={cancelConfirmRef} onClick={() => setConfirmFreeze(false)}>Seguir cuidándola</button>
              <button type="button" className="button button-primary" ref={firstConfirmRef} onClick={freezePlant}>Sí, congelar</button>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">{family.label} · {approach.label}</p>
            <h2 id="plant-detail-title">{plant.name}</h2>

        {editing ? (
          <form className="plant-edit-form" onSubmit={saveEdits}>
            <label>
              Nombre de la planta
              <input name="name" value={form.name} onChange={updateField} maxLength={60} required />
            </label>
            <label>
              Mi microacción
              <textarea name="action" value={form.action} onChange={updateField} maxLength={240} rows={3} required />
            </label>
            <label>
              Frecuencia
              <select name="frequency" value={form.frequency} onChange={updateField}>
                <option value="daily">Cada día</option>
                <option value="weekly">Cada semana</option>
              </select>
            </label>
            <div className="context-fields">
              <label>Después de…<input name="moment" value={form.moment} onChange={updateField} maxLength={100} /></label>
              <label>En…<input name="place" value={form.place} onChange={updateField} maxLength={100} /></label>
            </div>
            {error && <p className="inline-error" role="alert">{error}</p>}
            <div className="detail-actions">
              <button type="button" className="button button-quiet" onClick={() => setEditing(false)}>Cancelar</button>
              <button type="submit" className="button button-primary">Guardar cambios</button>
            </div>
          </form>
        ) : (
          <>
            <p className="detail-action-text">{plant.action}</p>
            <dl className="detail-facts">
              <div><dt>Frecuencia</dt><dd>{plant.frequency === 'weekly' ? 'Cada semana' : 'Cada día'}</dd></div>
              <div><dt>Después de</dt><dd>{plant.cue.moment || 'Sin definir'}</dd></div>
              <div><dt>Lugar</dt><dd>{plant.cue.place || 'Sin definir'}</dd></div>
              <div><dt>Creada</dt><dd>{formatDate(plant.createdAt)}</dd></div>
              <div><dt>Último cuidado</dt><dd>{plant.lastCareDay ? formatDate(`${plant.lastCareDay}T12:00:00`) : 'Aún sin registros'}</dd></div>
            </dl>
            <div className="detail-vitality">
              <span>Vitalidad</span><strong>{plant.health}%</strong>
              <div className="health-meter" role="progressbar" aria-label={`Vitalidad de ${plant.name}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={plant.health}><span style={{ width: `${plant.health}%` }} /></div>
              <small>{plant.growthPoints} cuidados · Nivel {plant.level}</small>
            </div>
            <section className="plant-history" aria-labelledby="plant-history-title">
              <h3 id="plant-history-title">Últimos momentos</h3>
              {events.length ? (
                <ul>{events.map((event, index) => (
                  <li key={`${event.type}-${event.dayKey ?? index}-${index}`}>
                    <span className={`history-dot history-${event.type}`} aria-hidden="true" />
                    <span>{historyLabel(event)}</span>
                    <time dateTime={event.dayKey ?? event.at ?? ''}>{formatDate(historyDate(event))}</time>
                  </li>
                ))}</ul>
              ) : <p>Aún no hay actividad. El primer cuidado deja la primera marca.</p>}
            </section>
            <div className="detail-actions">
              <button type="button" className="button button-quiet" onClick={() => setEditing(true)}>Editar microacción</button>
              <button type="button" className="button button-outline-danger" ref={freezeButtonRef} onClick={() => setConfirmFreeze(true)}>Congelar planta</button>
            </div>
          </>
        )}
          </>
        )}
      </section>
    </div>
  );
}
