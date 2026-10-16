import test from 'node:test';
import assert from 'node:assert/strict';
import { addUserTopic, normalizeUserTopics, removeUserTopic } from './userTopics.js';
import { createDatabase, createStore } from './store.js';

test('normaliza temas guardados, descarta vacíos y evita duplicados sin distinguir mayúsculas', () => {
  assert.deepEqual(normalizeUserTopics([' Física ', '', 'física', null, 'Historia']), ['Física', 'Historia']);
});

test('agrega un tema recortado y no duplica uno ya guardado', () => {
  assert.deepEqual(addUserTopic(['Física'], '  Historia '), ['Física', 'Historia']);
  assert.deepEqual(addUserTopic(['Física'], ' física '), ['Física']);
  assert.deepEqual(addUserTopic(['Física'], '   '), ['Física']);
});

test('elimina un tema guardado sin afectar los demás', () => {
  assert.deepEqual(removeUserTopic(['Física', 'Historia'], 'física'), ['Historia']);
});

test('los temas rápidos se guardan localmente y son independientes por perfil', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const first = createStore({ db: createDatabase(storage) });
  const firstUser = first.getState().activeUser;

  first.addQuickTopic('Física');
  assert.equal(first.addQuickTopic(' física '), false);
  first.createUser('Ana', '#10B981', 60, '🎓');
  const ana = first.getState().activeUser;
  first.addQuickTopic('Historia');

  const second = createStore({ db: createDatabase(storage) });
  assert.deepEqual(second.getState().allUsers.find((user) => user.id === firstUser.id).quickTopics, ['Física']);
  assert.deepEqual(second.getState().allUsers.find((user) => user.id === ana.id).quickTopics, ['Historia']);
  second.switchActiveUser(second.getState().allUsers.find((user) => user.id === ana.id));
  assert.deepEqual(second.getState().activeUser.quickTopics, ['Historia']);
  second.removeQuickTopic('historia');
  assert.deepEqual(second.getState().activeUser.quickTopics, []);
});
