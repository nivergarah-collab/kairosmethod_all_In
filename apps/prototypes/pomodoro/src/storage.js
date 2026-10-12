// localStorage seguro (puede faltar o lanzar en ventanas privadas).
export function safeLocalStorage() {
  try {
    const s = window.localStorage;
    s.getItem('__t');
    return s;
  } catch {
    return null;
  }
}
