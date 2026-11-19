const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const test = require('node:test');
const CoordinatorProfile = require('../models/CoordinatorProfile');
const InstructorProfile = require('../models/InstructorProfile');
const LearnerProfile = require('../models/LearnerProfile');
const User = require('../models/User');
const migrateRoleCollections = require('../config/migrateRoleCollections');

test('role migration preserves IDs, credentials and legacy records', async (t) => {
  const previous = {
    allow: process.env.ALLOW_ROLE_COLLECTIONS_MIGRATION,
    mongoUri: process.env.MONGO_URI,
    nodeEnv: process.env.NODE_ENV,
    allowDrop: process.env.ALLOW_LEGACY_USERS_DROP,
    runArgument: process.argv[2],
    dropArgument: process.argv[3],
  };
  const mongo = await MongoMemoryServer.create();
  process.env.ALLOW_ROLE_COLLECTIONS_MIGRATION = 'true';
  process.env.MONGO_URI = mongo.getUri('role-migration-test');
  process.env.NODE_ENV = 'test';
  process.argv[2] = '--run';

  t.after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
    if (previous.allow === undefined) delete process.env.ALLOW_ROLE_COLLECTIONS_MIGRATION;
    else process.env.ALLOW_ROLE_COLLECTIONS_MIGRATION = previous.allow;
    if (previous.mongoUri === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = previous.mongoUri;
    if (previous.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous.nodeEnv;
    if (previous.allowDrop === undefined) delete process.env.ALLOW_LEGACY_USERS_DROP;
    else process.env.ALLOW_LEGACY_USERS_DROP = previous.allowDrop;
    if (previous.runArgument === undefined) delete process.argv[2];
    else process.argv[2] = previous.runArgument;
    if (previous.dropArgument === undefined) delete process.argv[3];
    else process.argv[3] = previous.dropArgument;
  });

  await mongoose.connect(process.env.MONGO_URI);
  const legacyAccounts = await User.create([
    {
      nombre: 'Instructor legado',
      email: 'instructor.legado@example.com',
      password: 'Legacy-password-2026',
      rol: 'instructor',
      especialidad: 'Desarrollo',
    },
    {
      nombre: 'Aprendiz legado',
      email: 'aprendiz.legado@example.com',
      password: 'Legacy-password-2026',
      rol: 'aprendiz',
      tipoDocumento: 'TI',
      documento: '1234567890',
    },
    {
      nombre: 'Coordinador legado',
      email: 'coordinador.legado@example.com',
      password: 'Legacy-password-2026',
      rol: 'coordinador',
    },
  ]);
  const credentials = await Promise.all(
    legacyAccounts.map(async (user) => {
      const record = await User.findById(user._id).select('+password').lean();
      return [String(user._id), record.password];
    })
  );
  const credentialsById = new Map(credentials);

  await migrateRoleCollections();

  assert.equal(await InstructorProfile.countDocuments(), 1);
  assert.equal(await LearnerProfile.countDocuments(), 1);
  assert.equal(await CoordinatorProfile.countDocuments(), 1);
  for (const user of legacyAccounts) {
    assert.ok(await User.exists({ _id: user._id }));
    const Profile = user.rol === 'instructor'
      ? InstructorProfile
      : user.rol === 'aprendiz' ? LearnerProfile : CoordinatorProfile;
    const profile = await Profile.findById(user._id).select('+password').lean();
    assert.equal(profile.nombre, user.nombre);
    assert.equal(profile.email, user.email);
    assert.equal(profile.rol, user.rol);
    assert.equal(profile.password, credentialsById.get(String(user._id)));
    assert.equal(Object.hasOwn(profile, 'cuentaId'), false);
  }

  await migrateRoleCollections();
  assert.equal(await InstructorProfile.countDocuments(), 1);
  assert.equal(await LearnerProfile.countDocuments(), 1);
  assert.equal(await CoordinatorProfile.countDocuments(), 1);

  process.env.ALLOW_LEGACY_USERS_DROP = 'true';
  process.argv[3] = '--delete-legacy';
  await migrateRoleCollections();
  assert.equal(await User.countDocuments(), 0);
  assert.equal(await InstructorProfile.countDocuments(), 1);
  assert.equal(await LearnerProfile.countDocuments(), 1);
  assert.equal(await CoordinatorProfile.countDocuments(), 1);
});
