// Pruebas del inyector de PWA. Ejecutar: node --test infra/app/inject-pwa.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { injectPwa, normalizeBase, injectHtml, MARKER, buildHash } from './inject-pwa.mjs';

const HTML = '<!doctype html><html><head><meta name="theme-color" content="#123456"><title>Sitio · X</title></head><body></body></html>';
function site() {
  const d = mkdtempSync(join(tmpdir(), 'pwa-'));
  mkdirSync(join(d, 'assets'));
  mkdirSync(join(d, 'prototypes', 'uno'), { recursive: true });
  writeFileSync(join(d, 'index.html'), HTML.replace('</head>', '<script src="/repo/assets/a.js"></script></head>'));
  writeFileSync(join(d, 'assets', 'a.js'), 'console.log(1)');
  writeFileSync(join(d, 'prototypes', 'uno', 'index.html'), HTML.replace('Sitio', 'Uno'));
  return d;
}

test('normalizeBase', () => {
  assert.equal(normalizeBase(''), '');
  assert.equal(normalizeBase('/'), '');
  assert.equal(normalizeBase('repo/'), '/repo');
  assert.equal(normalizeBase('/repo'), '/repo');
});

test('genera manifest válido bajo el base path', () => {
  const d = site();
  const r = injectPwa({ dir: d, base: '/repo' });
  const m = JSON.parse(readFileSync(join(d, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.start_url, '/repo/');
  assert.equal(m.scope, '/repo/');
  assert.equal(m.display, 'standalone');
  assert.equal(m.theme_color, '#123456'); // detectado del index.html
  assert.ok(m.name && m.short_name && m.background_color);
  assert.ok(m.icons.some((i) => i.sizes === '192x192' && i.purpose === 'maskable'));
  assert.ok(m.icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable'));
  assert.equal(m.shortcuts[0].url, '/repo/prototypes/uno/');
  assert.equal(r.pages, 2);
  for (const f of ['sw.js', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) assert.ok(existsSync(join(d, f)), f);
  assert.equal(readFileSync(join(d, 'icon-512.png')).subarray(1, 4).toString(), 'PNG');
});

test('el SW usa el base, precachea assets y cambia con el contenido', () => {
  const d = site();
  injectPwa({ dir: d, base: '/repo' });
  const sw = readFileSync(join(d, 'sw.js'), 'utf8');
  assert.match(sw, /const SCOPE = "\/repo\/"/);
  assert.match(sw, /\/repo\/assets\/a\.js/);
  const v1 = buildHash(site());
  const d2 = site(); writeFileSync(join(d2, 'assets', 'a.js'), 'console.log(2)');
  assert.notEqual(v1, buildHash(d2));
});

test('HTML: etiquetas, Capacitor desactivado e idempotencia', () => {
  const out = injectHtml(HTML, { base: '/repo', themeColor: '#000000' });
  assert.ok(out.includes(MARKER));
  assert.ok(out.includes('href="/repo/manifest.webmanifest"'));
  assert.ok(out.includes('window.Capacitor'));
  assert.equal((out.match(/theme-color/g) || []).length, 1); // no duplica el existente
  assert.equal(injectHtml(out, { base: '/repo', themeColor: '#000000' }), out);
});

test('base vacío (sitio en la raíz)', () => {
  const d = site();
  injectPwa({ dir: d, base: '' });
  assert.equal(JSON.parse(readFileSync(join(d, 'manifest.webmanifest'), 'utf8')).scope, '/');
});

test('falla limpio si no hay index.html y no deja archivos', () => {
  const d = mkdtempSync(join(tmpdir(), 'pwa-'));
  assert.throws(() => injectPwa({ dir: d, base: '/repo' }), /index\.html/);
  assert.equal(existsSync(join(d, 'sw.js')), false);
});

test('HTML sin </head>: falla antes de escribir nada', () => {
  const d = site();
  writeFileSync(join(d, 'prototypes', 'uno', 'index.html'), '<html></html>');
  assert.throws(() => injectPwa({ dir: d, base: '/repo' }), /head/);
  assert.equal(existsSync(join(d, 'sw.js')), false);
  assert.ok(!readFileSync(join(d, 'index.html'), 'utf8').includes(MARKER));
});
