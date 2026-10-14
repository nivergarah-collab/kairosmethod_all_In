import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareWeb, SHIM_NAME } from './prepare-web.mjs';
import { setVersion } from './set-version.mjs';

function fakeDist() {
  const d = mkdtempSync(join(tmpdir(), 'dist-'));
  mkdirSync(join(d, 'prototypes', 'a'), { recursive: true });
  writeFileSync(join(d, 'index.html'), '<html><head><title>x</title></head><body></body></html>');
  writeFileSync(join(d, 'prototypes', 'a', 'index.html'), '<html><head></head><body></body></html>');
  writeFileSync(join(d, '.nojekyll'), '');
  return d;
}

test('prepareWeb copia el sitio, inyecta el ajuste en cada HTML y es idempotente', () => {
  const dist = fakeDist(); const www = join(mkdtempSync(join(tmpdir(), 'www-')), 'www');
  assert.equal(prepareWeb(dist, www), 2);
  assert.ok(existsSync(join(www, SHIM_NAME)));
  assert.ok(!existsSync(join(www, '.nojekyll')));
  for (const f of ['index.html', 'prototypes/a/index.html']) {
    assert.match(readFileSync(join(www, f), 'utf8'), new RegExp(`<script src="/${SHIM_NAME}"></script></head>`));
  }
  assert.equal(prepareWeb(www, www + '2'), 0); // ya inyectado: no duplica
});

test('prepareWeb falla si no hay index.html', () => {
  assert.throws(() => prepareWeb(mkdtempSync(join(tmpdir(), 'vacio-')), join(tmpdir(), 'x-www')), /Falta/);
});

test('setVersion reemplaza versionCode y versionName', () => {
  const out = setVersion('versionCode 1\n versionName "1.0"', '7', '0.1.0-abc');
  assert.match(out, /versionCode 7/); assert.match(out, /versionName "0\.1\.0-abc"/);
});

test('setVersion rechaza valores peligrosos o un build.gradle inesperado', () => {
  assert.throws(() => setVersion('versionCode 1\nversionName "1"', 'x', 'a'), /versionCode/);
  assert.throws(() => setVersion('versionCode 1\nversionName "1"', '1', 'a"; rm'), /versionName/);
  assert.throws(() => setVersion('nada', '1', 'a'), /formato/);
});
