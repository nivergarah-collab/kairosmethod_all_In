// Pone versionCode/versionName en android/app/build.gradle (el proyecto android se genera en cada build).
// Uso: node scripts/set-version.mjs <build.gradle> <versionCode> <versionName>
import { readFileSync, writeFileSync } from 'node:fs';

export function setVersion(text, code, name) {
  if (!/^\d+$/.test(String(code))) throw new Error(`versionCode no válido: ${code}`);
  if (!/^[\w.+-]+$/.test(name)) throw new Error(`versionName no válido: ${name}`);
  if (!/versionCode\s+\d+/.test(text) || !/versionName\s+"[^"]*"/.test(text)) {
    throw new Error('build.gradle no tiene versionCode/versionName con el formato esperado.');
  }
  return text.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "${name}"`);
}

if (process.argv[1] && process.argv[1].endsWith('set-version.mjs')) {
  const [file, code, name] = process.argv.slice(2);
  try { writeFileSync(file, setVersion(readFileSync(file, 'utf8'), code, name)); console.log(`versionCode=${code} versionName=${name}`); }
  catch (e) { console.error(`Error: ${e.message}`); process.exit(1); }
}
