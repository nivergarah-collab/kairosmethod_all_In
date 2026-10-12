// Memoria del tutorial: si ya se vio o se saltó. Todo con try/catch: si el almacenamiento
// está bloqueado o falla, la app sigue funcionando (el tutorial solo no recuerda).
export const TUTORIAL_KEY = 'kairos_montessori_tutorial_v1';
export const STATUSES = ['done', 'skipped'];

// Devuelve el almacenamiento del navegador o null (acceder a localStorage también puede lanzar).
export function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

// 'done' | 'skipped' | null (nunca visto, valor desconocido o almacenamiento inaccesible).
export function readTutorialStatus(storage) {
  try {
    const v = storage?.getItem(TUTORIAL_KEY);
    return STATUSES.includes(v) ? v : null;
  } catch {
    return null;
  }
}

// true si se pudo guardar.
export function writeTutorialStatus(storage, status) {
  if (!STATUSES.includes(status)) return false;
  try {
    if (!storage) return false;
    storage.setItem(TUTORIAL_KEY, status);
    return true;
  } catch {
    return false;
  }
}

// El tutorial se abre solo la primera vez (cuando no hay nada recordado).
export function shouldAutoOpen(storage) {
  return readTutorialStatus(storage) === null;
}
