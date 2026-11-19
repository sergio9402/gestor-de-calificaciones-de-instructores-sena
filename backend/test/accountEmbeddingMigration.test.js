const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const test = require('node:test');
const CoordinatorProfile = require('../models/CoordinatorProfile');
const InstructorProfile = require('../models/InstructorProfile');
const LearnerProfile = require('../models/LearnerProfile');
const { hashPassword } = require('../utils/password');
const migrateAccountsIntoProfiles = require('../config/migrateAccountsIntoProfiles');

test('account migration embeds credentials before optionally dropping cuentas', async (t) => {
  const previous = {
    allow: process.env.ALLOW_ACCOUNT_EMBEDDING_MIGRATION,
    allowDrop: process.env.ALLOW_ACCOUNTS_DROP,
    mongoUri: process.env.MONGO_URI,
    nodeEnv: process.env.NODE_ENV,
    runArgument: process.argv[2],
    dropArgument: process.argv[3],
  };
  const mongo = await MongoMemoryServer.create();
  process.env.ALLOW_ACCOUNT_EMBEDDING_MIGRATION = 'true';
  process.env.ALLOW_ACCOUNTS_DROP = 'true';
  process.env.MONGO_URI = mongo.getUri('account-embedding-migration-test');
  process.env.NODE_ENV = 'test';
  process.argv[2] = '--run';
  delete process.argv[3];

  t.after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
    for (const [key, value] of [
      ['ALLOW_ACCOUNT_EMBEDDING_MIGRATION', previous.allow],
      ['ALLOW_ACCOUNTS_DROP', previous.allowDrop],
      ['MONGO_URI', previous.mongoUri],
      ['NODE_ENV', previous.nodeEnv],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (previous.runArgument === undefined) delete process.argv[2];
    else process.argv[2] = previous.runArgument;
    if (previous.dropArgument === undefined) delete process.argv[3];
    else process.argv[3] = previous.dropArgument;
  });

  await mongoose.connect(process.env.MONGO_URI);
  const accounts = mongoose.connection.db.collection('cuentas');
  const accountRecords = [
    { nombre: 'Instructor migrado', email: 'instructor.migrado@example.test', rol: 'instructor' },
    { nombre: 'Aprendiz migrado', email: 'aprendiz.migrado@example.test', rol: 'aprendiz' },
    { nombre: 'Coordinación migrada', email: 'coordinacion.migrada@example.test', rol: 'coordinador' },
  ].map(async (user) => ({
    ...user,
    _id: new mongoose.Types.ObjectId(),
    password: await hashPassword('Migration-password-2026'),
    activo: true,
    authVersion: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const records = await Promise.all(accountRecords);
  await accounts.insertMany(records);
  const instructor = records.find((user) => user.rol === 'instructor');
  await InstructorProfile.collection.insertOne({
    _id: instructor._id,
    cuentaId: instructor._id,
    especialidad: 'Desarrollo de software',
  });
  await InstructorProfile.collection.createIndex({ cuentaId: 1 }, { unique: true });

  await migrateAccountsIntoProfiles();

  assert.equal(await accounts.countDocuments(), 3);
  assert.equal(await InstructorProfile.collection.countDocuments({ cuentaId: { $exists: true } }), 0);
  assert.equal(await LearnerProfile.countDocuments(), 1);
  assert.equal(await CoordinatorProfile.countDocuments(), 1);
  for (const user of records) {
    const Profile = user.rol === 'instructor'
      ? InstructorProfile
      : user.rol === 'aprendiz' ? LearnerProfile : CoordinatorProfile;
    const profile = await Profile.findById(user._id).select('+password +authVersion').lean();
    assert.equal(profile.nombre, user.nombre);
    assert.equal(profile.email, user.email);
    assert.equal(profile.password, user.password);
    assert.equal(profile.authVersion, 2);
  }
  assert.equal(
    (await InstructorProfile.findById(instructor._id).lean()).especialidad,
    'Desarrollo de software'
  );

  process.argv[3] = '--drop-accounts';
  await migrateAccountsIntoProfiles();
  assert.equal(
    await mongoose.connection.db.listCollections({ name: 'cuentas' }).hasNext(),
    false
  );
  assert.equal(await InstructorProfile.countDocuments(), 1);
  assert.equal(await LearnerProfile.countDocuments(), 1);
  assert.equal(await CoordinatorProfile.countDocuments(), 1);
});
