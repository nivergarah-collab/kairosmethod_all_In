// Copia el sitio ya construido (dist/) a mobile/www y le agrega el ajuste de enlaces a carpetas.
// Uso: node scripts/prepare-web.mjs <dist> <www>
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SHIM_NAME = 'capacitor-dirs.js';
const TAG = `<script src="/${SHIM_NAME}"></script>`;

function htmlFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...htmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

export function prepareWeb(dist, www) {
  if (!existsSync(join(dist, 'index.html')) || statSync(join(dist, 'index.html')).size === 0) {
    throw new Error(`Falta ${join(dist, 'index.html')}: construye el sitio antes de empaquetar el apk.`);
  }
  rmSync(www, { recursive: true, force: true });
  mkdirSync(www, { recursive: true });
  cpSync(dist, www, { recursive: true });
  rmSync(join(www, '.nojekyll'), { force: true });
  cpSync(join(dirname(fileURLToPath(import.meta.url)), SHIM_NAME), join(www, SHIM_NAME));
  let n = 0;
  for (const f of htmlFiles(www)) {
    const html = readFileSync(f, 'utf8');
    if (html.includes(TAG)) continue;
    writeFileSync(f, /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${TAG}</head>`) : TAG + html);
    n++;
  }
  return n;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [dist, www] = process.argv.slice(2);
  if (!dist || !www) { console.error('Uso: node scripts/prepare-web.mjs <dist> <www>'); process.exit(1); }
  try { console.log(`www listo: ${prepareWeb(resolve(dist), resolve(www))} páginas HTML ajustadas.`); }
  catch (e) { console.error(`Error: ${e.message}`); process.exit(1); }
}
