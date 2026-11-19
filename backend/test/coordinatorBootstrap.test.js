const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const test = require('node:test');
const CoordinatorProfile = require('../models/CoordinatorProfile');
const InstructorProfile = require('../models/InstructorProfile');
const { createInitialCoordinator } = require('../config/provisionCoordinator');
const { verifyPassword } = require('../utils/password');

test('coordinator bootstrap creates one hashed, sanitized initial profile', async (t) => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('coordinator-bootstrap-test'));
  t.after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  const coordinator = await createInitialCoordinator({
    nombre: 'Coordinación de Prueba',
    email: '  coordinacion@example.test ',
    password: 'ClaveInicial-Segura-2026',
  });

  assert.equal(coordinator.rol, 'coordinador');
  assert.equal(coordinator.email, 'coordinacion@example.test');
  assert.equal(Object.hasOwn(coordinator, 'password'), false);

  const storedCoordinator = await CoordinatorProfile.findOne({
    email: coordinator.email,
  }).select('+password');
  assert.equal(await verifyPassword('ClaveInicial-Segura-2026', storedCoordinator.password), true);
  assert.equal(await CoordinatorProfile.countDocuments({}), 1);
  assert.ok(await mongoose.connection.collection('system_bootstrap_locks')
    .findOne({ _id: 'initial-coordinator' }));
  await assert.rejects(
    createInitialCoordinator({
      nombre: 'Otra coordinación',
      email: 'otra@example.test',
      password: 'OtraClaveInicial-Segura-2026',
    }),
    /Ya existe un perfil de coordinación/
  );
  await CoordinatorProfile.deleteMany({});
  await assert.rejects(
    createInitialCoordinator({
      nombre: 'Otra coordinación',
      email: 'otra@example.test',
      password: 'OtraClaveInicial-Segura-2026',
    }),
    /aprovisionamiento inicial ya se ejecutó/
  );
});

test('coordinator bootstrap refuses email reuse across profile roles', async (t) => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('coordinator-bootstrap-email-test'));
  t.after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  await InstructorProfile.create({
    nombre: 'Instructor de Prueba',
    email: 'ocupado@example.test',
    password: 'OtraClaveInicial-Segura-2026',
  });

  await assert.rejects(
    createInitialCoordinator({
      nombre: 'Coordinación de Prueba',
      email: 'ocupado@example.test',
      password: 'ClaveInicial-Segura-2026',
    }),
    /Ya existe un usuario con este correo/
  );
  assert.equal(await CoordinatorProfile.countDocuments({}), 0);
  assert.equal(
    await mongoose.connection.collection('system_bootstrap_locks')
      .countDocuments({ _id: 'initial-coordinator' }),
    0
  );
});
