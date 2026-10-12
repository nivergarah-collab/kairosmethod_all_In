import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useEffect, useReducer, useState } from 'react';
import { createInitialGarden } from './state.js';
import { prepareGarden, reduceSpatialGarden } from './scene.js';
import { loadGarden, saveGarden } from './persistence.js';
import App from './App.jsx';
import './styles.css';
import './scene.css';

function initializeGarden() {
  try {
    return prepareGarden(loadGarden(window.localStorage) ?? createInitialGarden());
  } catch {
    return prepareGarden(createInitialGarden());
  }
}

function PrototypeShell() {
  const [garden, dispatch] = useReducer(reduceSpatialGarden, undefined, initializeGarden);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      saveGarden(garden, window.localStorage);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [garden]);

  return <App garden={garden} dispatch={dispatch} storageError={storageError} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrototypeShell />
  </StrictMode>,
);
