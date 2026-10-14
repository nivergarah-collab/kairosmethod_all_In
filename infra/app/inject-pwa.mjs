#!/usr/bin/env node
// Inyecta la PWA (manifest, íconos, service worker y etiquetas) sobre una carpeta de salida ya construida.
// No toca el código fuente: solo agrega archivos a <dir> y etiquetas a sus index.html. Solo Node estándar.
// Uso: node infra/app/inject-pwa.mjs --dir dist --base /mi-repo [--name KairosMethod --short-name Kairos
//        --description "..." --theme-color "#1d1b18" --background-color "#1d1b18" --lang es --precache-depth 2]
//   (--precache-depth: hasta cuántas carpetas de profundidad se guardan al instalar para uso sin conexión)
// BASE_PATH (variable de entorno) se usa si no se pasa --base. Base vacío = sitio en la raíz.
// Si algo falla, termina con código 1 sin dejar etiquetas a medias (los index.html se escriben al final).
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MARKER = '<!-- pwa:inyectada -->';
const DEFAULT_COLOR = '#1d1b18';
const CREAM = [242, 232, 213];
const ACCENT = [111, 191, 159];

// ---------- utilidades ----------
export function normalizeBase(raw) {
  let b = String(raw ?? '').trim();
  if (b === '' || b === '/') return '';
  if (!b.startsWith('/')) b = '/' + b;
  return b.replace(/\/+$/, '');
}

function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) out.push(p);
    }
  };
  walk(dir);
  return out.sort();
}

export function buildHash(dir) {
  const h = createHash('sha256');
  for (const f of listFiles(dir)) {
    h.update(relative(dir, f).split(sep).join('/'));
    h.update('\0');
    h.update(readFileSync(f));
    h.update('\0');
  }
  return h.digest('hex').slice(0, 12);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// ---------- PNG por código ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8 bits
  ihdr[9] = 6; // RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Reloj minimalista (kairos = el momento oportuno). maskable: fondo a sangre y glifo dentro del 80 % central.
export function renderIcon(size, bg, { maskable }) {
  const SS = 3;
  const out = Buffer.alloc(size * size * 4);
  const k = maskable ? 1 : 1.18; // el ícono "any" puede llenar más
  const R = 0.30 * k, W = 0.05 * k, corner = 0.22;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size - 0.5;
          const v = (y + (sy + 0.5) / SS) / size - 0.5;
          let inside = true;
          if (!maskable) {
            const qx = Math.abs(u) - (0.5 - corner), qy = Math.abs(v) - (0.5 - corner);
            inside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) <= corner;
          }
          if (!inside) continue;
          let c = bg;
          const d = Math.hypot(u, v);
          if (Math.abs(d - R) <= W / 2) c = CREAM;
          else if (distSeg(u, v, 0, 0, 0, -R * 0.62) <= W * 0.42) c = CREAM;
          else if (distSeg(u, v, 0, 0, R * 0.46, R * 0.34) <= W * 0.42) c = ACCENT;
          else if (d <= W * 0.75) c = ACCENT;
          r += c[0]; g += c[1]; b += c[2]; a += 255;
        }
      }
      const n = SS * SS, o = (y * size + x) * 4, cnt = a / 255;
      if (cnt > 0) { out[o] = Math.round(r / cnt); out[o + 1] = Math.round(g / cnt); out[o + 2] = Math.round(b / cnt); }
      out[o + 3] = Math.round(a / n);
    }
  }
  return encodePng(size, out);
}

// ---------- service worker ----------
export function buildServiceWorker({ base, version, precache = [] }) {
  const scope = base + '/';
  return `// Service worker generado por infra/app/inject-pwa.mjs (no editar a mano). Versión del build: ${version}
// HTML y todo lo que no tiene hash: red primero (con respaldo en caché). /assets/ (nombres con hash): caché primero.
const VERSION = ${JSON.stringify(version)};
const CACHE = 'kairos-pwa-' + VERSION;
const SCOPE = ${JSON.stringify(scope)};
const NETWORK_TIMEOUT_MS = 4000;
// Páginas y recursos que ellas referencian: se guardan al instalar para que la app abra sin conexión.
const PRECACHE = ${JSON.stringify([scope, scope + 'manifest.webmanifest', ...precache], null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('kairos-pwa-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function store(request, response) {
  if (response && response.ok && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
  }
  return response;
}

function networkFirst(request) {
  return new Promise((resolve) => {
    let settled = false;
    const fromCache = () => caches.match(request, { ignoreSearch: false });
    const timer = setTimeout(() => {
      fromCache().then((hit) => { if (hit && !settled) { settled = true; resolve(hit); } });
    }, NETWORK_TIMEOUT_MS);
    fetch(request, { cache: 'no-cache' })
      .then((res) => { if (!settled) { settled = true; clearTimeout(timer); resolve(store(request, res)); } else store(request, res); })
      .catch(() => fromCache().then((hit) => {
        clearTimeout(timer);
        if (!settled) { settled = true; resolve(hit || Response.error()); }
      }));
  });
}

function cacheFirst(request) {
  return caches.match(request).then((hit) => hit || fetch(request).then((res) => store(request, res)));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
  const hashed = url.pathname.startsWith(SCOPE + 'assets/') || /\\/assets\\//.test(url.pathname);
  event.respondWith(hashed ? cacheFirst(req) : networkFirst(req));
});
`;
}

// ---------- manifest y HTML ----------
function titleOf(file, fallback) {
  try {
    const m = /<title>([^<]*)<\/title>/i.exec(readFileSync(file, 'utf8'));
    const t = m && m[1].trim();
    return t ? t.split('·')[0].trim() : fallback;
  } catch { return fallback; }
}

export function buildManifest({ base, name, shortName, description, themeColor, backgroundColor, lang, shortcuts, version }) {
  const scope = base + '/';
  return {
    id: scope,
    name,
    short_name: shortName,
    description,
    lang,
    start_url: scope,
    scope,
    display: 'standalone',
    orientation: 'any',
    theme_color: themeColor,
    background_color: backgroundColor,
    icons: [
      { src: `${scope}icon-192.png?v=${version}`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${scope}icon-512.png?v=${version}`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${scope}icon-maskable-192.png?v=${version}`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: `${scope}icon-maskable-512.png?v=${version}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    ...(shortcuts.length ? { shortcuts } : {}),
  };
}

export function injectHtml(html, { base, themeColor }) {
  if (html.includes(MARKER)) return html; // idempotente
  const scope = base + '/';
  const hasTheme = /<meta[^>]+name=["']theme-color["']/i.test(html);
  const tags = [
    MARKER,
    `<link rel="manifest" href="${esc(scope)}manifest.webmanifest" />`,
    hasTheme ? '' : `<meta name="theme-color" content="${esc(themeColor)}" />`,
    `<link rel="apple-touch-icon" href="${esc(scope)}apple-touch-icon.png" />`,
    '<meta name="mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    // Dentro de Capacitor (APK) no se registra: la app ya lleva la web empaquetada.
    `<script>(function(){if(window.Capacitor||!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;` +
      `window.addEventListener('load',function(){navigator.serviceWorker.register(${JSON.stringify(scope + 'sw.js')},` +
      `{scope:${JSON.stringify(scope)},updateViaCache:'none'}).catch(function(e){console.warn('PWA: no se registró el service worker',e);});});})();</script>`,
  ].filter(Boolean).join('\n    ');
  if (!/<\/head>/i.test(html)) throw new Error('index.html sin </head>');
  return html.replace(/<\/head>/i, `    ${tags}\n  </head>`);
}

// ---------- principal ----------
export function injectPwa(opts) {
  const dir = resolve(opts.dir);
  if (!existsSync(join(dir, 'index.html'))) throw new Error(`No existe ${join(dir, 'index.html')}: ¿se construyó el sitio?`);
  const base = normalizeBase(opts.base);
  const version = buildHash(dir); // antes de agregar nada: depende solo del sitio construido
  const rootHtml = readFileSync(join(dir, 'index.html'), 'utf8');
  const detectedTheme = /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i.exec(rootHtml)?.[1];
  const themeColor = hexToRgb(opts.themeColor ?? '') ? opts.themeColor : (hexToRgb(detectedTheme ?? '') ? detectedTheme : DEFAULT_COLOR);
  const backgroundColor = hexToRgb(opts.backgroundColor ?? '') ? opts.backgroundColor : themeColor;
  const name = opts.name || titleOf(join(dir, 'index.html'), 'KairosMethod');
  const shortName = opts.shortName || (name.length <= 12 ? name : name.split(/\s+/)[0].slice(0, 12));

  const shortcuts = [];
  const protoDir = join(dir, 'prototypes');
  if (existsSync(protoDir)) {
    for (const e of readdirSync(protoDir, { withFileTypes: true })) {
      const idx = join(protoDir, e.name, 'index.html');
      if (e.isDirectory() && existsSync(idx)) {
        const t = titleOf(idx, e.name);
        shortcuts.push({ name: t, url: `${base}/prototypes/${e.name}/` });
      }
    }
    shortcuts.sort((a, b) => a.url.localeCompare(b.url)).splice(4); // Chrome muestra hasta 4
  }

  const bg = hexToRgb(backgroundColor);
  const manifest = buildManifest({
    base, name, shortName, version, lang: opts.lang || 'es', themeColor, backgroundColor, shortcuts,
    description: opts.description || 'Métodos de estudio para enseñanza media, instalables como aplicación.',
  });

  // 1) Calcular todo en memoria; 2) escribir archivos nuevos; 3) al final, editar los index.html.
  const htmls = listFiles(dir).filter((f) => f.endsWith(`${sep}index.html`));
  const maxDepth = Number(opts.precacheDepth ?? 2);
  const precache = [...new Set(htmls.flatMap((f) => {
    const rel = relative(dir, f).split(sep).join('/').replace(/index\.html$/, '');
    if (rel.split('/').filter(Boolean).length > maxDepth) return [];
    const refs = [...readFileSync(f, 'utf8').matchAll(/(?:src|href)=["'](\/[^"']+)["']/g)].map((m) => m[1]);
    return [`${base}/${rel}`, ...refs.filter((u) => u.startsWith(base + '/') && !u.includes('#') && /\.(js|css|png|svg|webp|jpg|woff2?)$/.test(u))];
  }))].filter((u) => u !== base + '/');
  const files = {
    'manifest.webmanifest': JSON.stringify(manifest, null, 2) + '\n',
    'sw.js': buildServiceWorker({ base, version, precache }),
    'icon-192.png': renderIcon(192, bg, { maskable: false }),
    'icon-512.png': renderIcon(512, bg, { maskable: false }),
    'icon-maskable-192.png': renderIcon(192, bg, { maskable: true }),
    'icon-maskable-512.png': renderIcon(512, bg, { maskable: true }),
    'apple-touch-icon.png': renderIcon(180, bg, { maskable: true }),
  };
  const edited = htmls.map((f) => [f, injectHtml(readFileSync(f, 'utf8'), { base, themeColor })]);
  for (const [n, c] of Object.entries(files)) writeFileSync(join(dir, n), c);
  JSON.parse(readFileSync(join(dir, 'manifest.webmanifest'), 'utf8')); // válido
  for (const [f, c] of edited) writeFileSync(f, c);
  return { version, base, pages: edited.length, name, themeColor };
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error(`Argumento no reconocido: ${a}`);
    const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    o[key] = argv[++i];
    if (o[key] === undefined) throw new Error(`Falta el valor de ${a}`);
  }
  return o;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    const r = injectPwa({ ...o, dir: o.dir ?? 'dist', base: o.base ?? process.env.BASE_PATH ?? '' });
    console.log(`PWA inyectada: "${r.name}" base="${r.base}/" versión=${r.version} páginas=${r.pages} color=${r.themeColor}`);
  } catch (e) {
    console.error(`PWA no inyectada: ${e.message}`);
    process.exit(1);
  }
}
