// Persistencia del tutorial. Clave propia, distinta de 'kaizen-garden-v2' (datos del jardín).
export const TUTORIAL_STORAGE_KEY = 'kairos_kaizen_tutorial_v1';

function getStorage(storage) {
  if (storage) return storage;
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

// Devuelve 'done' | 'skipped' | null (no visto) | undefined (no se pudo leer el almacenamiento).
export function readTutorialStatus(storage) {
  try {
    const target = getStorage(storage);
    if (!target) return undefined;
    const value = target.getItem(TUTORIAL_STORAGE_KEY);
    return value === 'done' || value === 'skipped' ? value : null;
  } catch {
    return undefined;
  }
}

// Solo se abre solo si se pudo leer y aún no se vio. Si el almacenamiento falla, no insiste en cada carga.
export function shouldAutoStart(storage) {
  return readTutorialStatus(storage) === null;
}

export function markTutorialSeen(status, storage) {
  if (status !== 'done' && status !== 'skipped') return false;
  try {
    const target = getStorage(storage);
    if (!target) return false;
    target.setItem(TUTORIAL_STORAGE_KEY, status);
    return true;
  } catch {
    return false;
  }
}
