import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const screenSource = readFileSync(fileURLToPath(new URL('./SessionConfigScreen.jsx', import.meta.url)), 'utf8');

test('objetivos por bloque quedan bajo la configuración de bloques y antes de las preferencias', () => {
  const firstColumn = screenSource.indexOf('className="rs-col"');
  const configColumn = screenSource.indexOf('className="rs-col"', firstColumn + 1);
  const blockConfiguration = screenSource.indexOf('<Card tour="sliders"', configColumn);
  const blockGoals = screenSource.indexOf('tour="blockgoals"');
  const preferences = screenSource.indexOf('<Card testId="theme_switch_card"', configColumn);

  assert.ok(configColumn >= 0, 'debe existir una segunda columna de configuración');
  assert.ok(blockConfiguration >= 0 && blockGoals > blockConfiguration, 'el panel debe ir después de los controles de bloques');
  assert.ok(preferences > blockGoals, 'el panel debe preceder a las preferencias');
});
