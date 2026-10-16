import test from 'node:test';
import assert from 'node:assert/strict';
import { limitProfileName, normalizeProfileName, MAX_PROFILE_NAME_LENGTH } from './profileName.js';

test('limita mientras se escribe sin alterar los espacios que el usuario está componiendo', () => {
  assert.equal(MAX_PROFILE_NAME_LENGTH, 50);
  assert.equal(limitProfileName(`${'A'.repeat(49)} `), `${'A'.repeat(49)} `);
  assert.equal(limitProfileName('B'.repeat(60)).length, 50);
});

test('no corta emojis ni caracteres acentuados compuestos en el límite', () => {
  const withEmoji = limitProfileName(`${'A'.repeat(49)}🌱${'B'.repeat(3)}`);
  const withAccent = limitProfileName(`${'A'.repeat(49)}e\u0301z`);

  assert.equal(withEmoji, `${'A'.repeat(49)}🌱`);
  assert.equal(withAccent, `${'A'.repeat(49)}e\u0301`);
});

test('normaliza al guardar: recorta espacios y nunca excede el límite', () => {
  assert.equal(normalizeProfileName('  María  '), 'María');
  assert.equal(normalizeProfileName(`  ${'C'.repeat(60)}  `).length, 50);
  assert.equal(normalizeProfileName('   '), '');
});
