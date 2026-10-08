import { FILE_KINDS, DEVICES, DEVICE_ROLES, MOODS } from '../state.js';

function Select({ label, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export default function ConfigForm({ item, dispatch }) {
  const c = item.config;
  const set = (patch) => dispatch({ type: 'config', id: item.id, patch });

  switch (item.type) {
    case 'file':
      return (
        <div className="config">
          <label className="field">
            <span>Nombre</span>
            <input value={c.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />
          </label>
          <Select label="Tipo" value={c.kind} options={FILE_KINDS} onChange={(kind) => set({ kind })} />
        </div>
      );
    case 'timer':
      return (
        <div className="config">
          <label className="field">
            <span>Minutos de la cuenta regresiva (1–120)</span>
            <input
              type="number"
              min={1}
              max={120}
              value={c.minutes}
              onChange={(e) => set({ minutes: e.target.value })}
            />
          </label>
        </div>
      );
    case 'notes':
      return (
        <div className="config">
          <label className="field">
            <span>Título</span>
            <input value={c.title} maxLength={40} onChange={(e) => set({ title: e.target.value })} />
          </label>
          <label className="field">
            <span>Notas</span>
            <textarea rows={3} maxLength={500} value={c.text} onChange={(e) => set({ text: e.target.value })} />
          </label>
        </div>
      );
    case 'device':
      return (
        <div className="config">
          <Select label="Dispositivo" value={c.device} options={DEVICES} onChange={(device) => set({ device })} />
          <Select label="Función" value={c.role} options={DEVICE_ROLES} onChange={(role) => set({ role })} />
        </div>
      );
    case 'music':
      return (
        <div className="config">
          <label className="field">
            <span>Playlist o ánimo (solo referencia, no reproduce)</span>
            <input value={c.playlist} maxLength={60} onChange={(e) => set({ playlist: e.target.value })} />
          </label>
          <Select label="Ambiente sonoro" value={c.mood} options={MOODS} onChange={(mood) => set({ mood })} />
        </div>
      );
    case 'lamp':
      return (
        <div className="config">
          <label className="check">
            <input type="checkbox" checked={c.on} onChange={(e) => set({ on: e.target.checked })} />
            Lámpara encendida
          </label>
        </div>
      );
    case 'water':
      return (
        <div className="config">
          <label className="check">
            <input type="checkbox" checked={c.filled} onChange={(e) => set({ filled: e.target.checked })} />
            Vaso lleno
          </label>
        </div>
      );
    default:
      return null;
  }
}
