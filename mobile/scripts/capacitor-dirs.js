// Se inyecta solo en la copia del sitio que va dentro del apk (mobile/www), nunca en el código fuente.
// La WebView de Capacitor no sirve carpetas: una ruta sin extensión (p. ej. /prototypes/pomodoro/)
// devuelve el index.html de la raíz. Aquí se reescribe el clic en enlaces a carpetas para que
// apunten a su index.html explícito.
(function () {
  document.addEventListener('click', function (ev) {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var el = ev.target;
    while (el && el.nodeType === 1 && el.tagName !== 'A') el = el.parentNode;
    if (!el || el.nodeType !== 1 || !el.href || el.hasAttribute('download')) return;
    var url;
    try { url = new URL(el.href, location.href); } catch (e) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === '/' || url.pathname.charAt(url.pathname.length - 1) !== '/') return;
    ev.preventDefault();
    url.pathname += 'index.html';
    if (el.target && el.target !== '_self') window.open(url.href, el.target);
    else location.assign(url.href);
  }, true);
})();
