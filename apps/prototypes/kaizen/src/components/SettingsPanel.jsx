import { useState } from 'react';
import { parseGardenJson, serializeGarden } from '../persistence.js';
import { HelpButton } from '../tutorial/HelpButton.jsx';

function downloadGarden(garden) {
  const blob = new Blob([serializeGarden(garden)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `jardin-kaizen-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SettingsPanel({ garden, storageError, onHelp, onBack, onImport, onNewGarden }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [confirmNew, setConfirmNew] = useState(false);
  const [message, setMessage] = useState('');

  const readFile = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    let parsed;
    try {
      parsed = parseGardenJson(await file.text());
    } catch {
      setPreview(null);
      setError('No se pudo leer el archivo seleccionado.');
      input.value = '';
      return;
    }
    input.value = '';
    if (!parsed.ok) {
      setPreview(null);
      setError(parsed.error);
      return;
    }
    setError('');
    setPreview(parsed);
  };

  const confirmImport = () => {
    onImport(preview.garden);
    setPreview(null);
    setMessage('Jardín recuperado desde el archivo JSON.');
  };

  return (
    <main className="garden-shell feature-page" id="garden-top" aria-labelledby="settings-title">
      <header className="site-masthead"><a className="wordmark" href="#garden-top"><span className="wordmark-mark" aria-hidden="true">✳</span><span>jardín <strong>kaizen</strong></span></a><div className="masthead-actions"><HelpButton onClick={onHelp} /><button className="button button-quiet" type="button" onClick={onBack}>Volver al jardín</button></div></header>
      <section className="feature-card settings-card" data-tour="settings">
        <p className="eyebrow">Este dispositivo</p><h1 id="settings-title">Ajustes y copias</h1>
        {storageError && <p className="inline-error" role="alert">El almacenamiento local está fallando. Descarga una copia JSON para resguardar el jardín.</p>}
        {message && <p className="garden-notice" role="status">{message}</p>}
        <section className="settings-section" aria-labelledby="export-title"><h2 id="export-title">Copia de seguridad</h2><p>Exporta plantas, herbario, historial, preferencias y reloj demo en un archivo local.</p><button className="button button-primary" type="button" onClick={() => downloadGarden(garden)}>Exportar jardín JSON</button></section>
        <section className="settings-section" aria-labelledby="import-title"><h2 id="import-title">Recuperar un jardín</h2><p>El archivo se revisa antes de reemplazar lo que tienes abierto.</p><label className="file-picker">Elegir archivo JSON<input type="file" accept="application/json,.json" onChange={readFile} /></label>
          {error && <p className="inline-error" role="alert">{error}</p>}
          {preview && <div className="import-preview" role="region" aria-label="Vista previa del jardín a importar"><h3>Vista previa</h3><p>{preview.summary.plantCount} plantas activas · {preview.summary.herbariumCount} en el herbario</p><p>Última actividad: {preview.summary.lastActivity ?? 'Sin registros'}</p><div className="detail-actions"><button type="button" className="button button-quiet" onClick={() => setPreview(null)}>Cancelar</button><button type="button" className="button button-primary" onClick={confirmImport}>Reemplazar con esta copia</button></div></div>}
        </section>
        <section className="settings-section" aria-labelledby="rules-title"><h2 id="rules-title">Reglas de esta versión</h2><ul><li>Un cuidado al día registra tu microacción y suma crecimiento.</li><li>Las pausas no reducen la vitalidad ni el progreso de tus plantas.</li><li>Puedes organizar tus plantas y llevarlas entre cuatro zonas. Su posición también forma parte de la copia JSON.</li><li>El reloj demo permite explorar el paso del tiempo. Son reglas del prototipo, no mediciones científicas.</li></ul></section>
        <section className="settings-section danger-section" aria-labelledby="new-garden-title"><h2 id="new-garden-title">Empezar de nuevo</h2><p>Un jardín nuevo reemplaza las plantas activas y vacía el herbario del jardín actual.</p>{confirmNew ? <div className="inline-confirm" role="alert"><p>¿Borrar este jardín y su herbario de este dispositivo?</p><button type="button" className="button button-quiet" onClick={() => setConfirmNew(false)}>Cancelar</button><button type="button" className="button button-outline-danger" onClick={onNewGarden}>Sí, empezar de nuevo</button></div> : <button className="button button-outline-danger" type="button" onClick={() => setConfirmNew(true)}>Crear nuevo jardín</button>}</section>
      </section>
    </main>
  );
}
