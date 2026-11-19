require('dotenv').config();
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const CoordinatorProfile = require('../models/CoordinatorProfile');
const InstructorProfile = require('../models/InstructorProfile');
const LearnerProfile = require('../models/LearnerProfile');
const { getProfileModel } = require('../services/userProfileService');
const { hashPassword, isPasswordHash } = require('../utils/password');

function assertMigrationEnabled() {
  if (
    process.argv[2] !== '--run' ||
    process.env.ALLOW_ACCOUNT_EMBEDDING_MIGRATION !== 'true' ||
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error(
      'Migración bloqueada. Requiere --run, ALLOW_ACCOUNT_EMBEDDING_MIGRATION=true y un entorno no productivo.'
    );
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI no está configurada.');
  if (
    process.argv[3] === '--drop-accounts' &&
    process.env.ALLOW_ACCOUNTS_DROP !== 'true'
  ) {
    throw new Error('Eliminar cuentas requiere ALLOW_ACCOUNTS_DROP=true.');
  }
}

async function assertProfilesComplete() {
  const incompleteProfiles = await Promise.all([
    InstructorProfile.collection.countDocuments({
      $or: [
        { nombre: { $exists: false } },
        { email: { $exists: false } },
        { password: { $exists: false } },
        { rol: { $ne: 'instructor' } },
        { cuentaId: { $exists: true } },
      ],
    }),
    LearnerProfile.collection.countDocuments({
      $or: [
        { nombre: { $exists: false } },
        { email: { $exists: false } },
        { password: { $exists: false } },
        { rol: { $ne: 'aprendiz' } },
        { cuentaId: { $exists: true } },
      ],
    }),
    CoordinatorProfile.collection.countDocuments({
      $or: [
        { nombre: { $exists: false } },
        { email: { $exists: false } },
        { password: { $exists: false } },
        { rol: { $ne: 'coordinador' } },
        { cuentaId: { $exists: true } },
      ],
    }),
  ]);
  if (incompleteProfiles.some(Boolean)) {
    throw new Error('La verificación encontró perfiles sin datos de acceso completos.');
  }
}

async function migrateAccountsIntoProfiles() {
  assertMigrationEnabled();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  const accountsCollection = mongoose.connection.db.collection('cuentas');
  const accounts = await accountsCollection.find({}).toArray();
  const emails = new Set();
  for (const account of accounts) {
    if (!['instructor', 'aprendiz', 'coordinador'].includes(account.rol)) {
      throw new Error(`El rol de la cuenta ${account._id} no es válido.`);
    }
    if (typeof account.email !== 'string' || typeof account.password !== 'string') {
      throw new Error(`La cuenta ${account._id} no tiene correo o contraseña.`);
    }
    if (typeof account.nombre !== 'string' || !account.nombre.trim()) {
      throw new Error(`La cuenta ${account._id} no tiene un nombre válido.`);
    }
    const email = account.email.toLowerCase().trim();
    if (emails.has(email)) throw new Error(`Hay más de una cuenta con el correo ${email}.`);
    emails.add(email);
  }

  for (const Profile of [InstructorProfile, LearnerProfile, CoordinatorProfile]) {
    const indexes = await Profile.collection.indexes();
    for (const index of indexes) {
      if (Object.hasOwn(index.key || {}, 'cuentaId')) {
        await Profile.collection.dropIndex(index.name);
      }
    }
  }

  const passwordsById = new Map();
  for (const account of accounts) {
    const Profile = getProfileModel(account.rol);
    const existing = await Profile.collection.findOne({
      $or: [{ _id: account._id }, { cuentaId: account._id }],
    }, { projection: { _id: 1 } });
    if (existing && String(existing._id) !== String(account._id)) {
      throw new Error(
        `El perfil ${existing._id} no conserva el identificador de su cuenta ${account._id}.`
      );
    }
    const storedPassword = isPasswordHash(account.password)
      ? account.password
      : await hashPassword(account.password);
    passwordsById.set(String(account._id), storedPassword);
    const authFields = {
      nombre: account.nombre,
      email: account.email.toLowerCase().trim(),
      password: storedPassword,
      rol: account.rol,
      activo: account.activo !== false,
      authVersion: account.authVersion || 0,
    };
    if (existing) {
      await Profile.collection.updateOne(
        { _id: existing._id },
        { $set: authFields, $unset: { cuentaId: '' } }
      );
    } else {
      await Profile.create({ _id: account._id, ...authFields });
    }
  }

  for (const announcement of await Announcement.collection.find({}).toArray()) {
    const coordinator = await CoordinatorProfile.exists({ _id: announcement.creadaPor });
    const instructor = coordinator
      ? null
      : await InstructorProfile.exists({ _id: announcement.creadaPor });
    const expectedRole = coordinator ? 'coordinador' : instructor ? 'instructor' : null;
    if (!expectedRole) {
      throw new Error(`No existe el autor de la novedad ${announcement._id}.`);
    }
    if (announcement.rolCreador && announcement.rolCreador !== expectedRole) {
      throw new Error(`El rol del autor de la novedad ${announcement._id} no coincide.`);
    }
    if (!announcement.rolCreador) {
      await Announcement.collection.updateOne(
        { _id: announcement._id },
        { $set: { rolCreador: expectedRole } }
      );
    }
  }

  await assertProfilesComplete();
  for (const account of accounts) {
    const profile = await getProfileModel(account.rol)
      .findById(account._id)
      .select('+password +authVersion')
      .lean();
    if (
      !profile ||
      profile.email !== account.email.toLowerCase().trim() ||
      profile.password !== passwordsById.get(String(account._id)) ||
      profile.nombre !== account.nombre ||
      profile.rol !== account.rol
    ) {
      throw new Error(`La verificación de la cuenta ${account._id} no fue satisfactoria.`);
    }
  }

  const accountsCollectionExists = await mongoose.connection.db
    .listCollections({ name: 'cuentas' })
    .hasNext();
  if (process.argv[3] === '--drop-accounts' && accountsCollectionExists) {
    await accountsCollection.drop();
  }

  console.log(
    `Migración completada: ${accounts.length} usuarios integrados en sus perfiles; colección cuentas ${process.argv[3] === '--drop-accounts' ? 'eliminada' : 'conservada'}.`
  );
}

if (require.main === module) {
  migrateAccountsIntoProfiles()
    .catch((error) => {
      console.error('[Account embedding migration error]', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    });
}

module.exports = migrateAccountsIntoProfiles;
