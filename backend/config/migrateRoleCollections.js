require('dotenv').config();
const mongoose = require('mongoose');
const CoordinatorProfile = require('../models/CoordinatorProfile');
const InstructorProfile = require('../models/InstructorProfile');
const LearnerProfile = require('../models/LearnerProfile');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { getProfileModel } = require('../services/userProfileService');
const { hashPassword, isPasswordHash } = require('../utils/password');

async function migrateRoleCollections() {
  if (
    process.argv[2] !== '--run' ||
    process.env.ALLOW_ROLE_COLLECTIONS_MIGRATION !== 'true' ||
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error(
      'Migración bloqueada. Requiere --run, ALLOW_ROLE_COLLECTIONS_MIGRATION=true y un entorno no productivo.'
    );
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI no está configurada.');

  await mongoose.connect(process.env.MONGO_URI);
  const legacyUsers = await User.find({})
    .select('+password +authVersion')
    .lean();
  let migratedProfiles = 0;

  for (const legacyUser of legacyUsers) {
    const Profile = getProfileModel(legacyUser.rol);
    const existingProfile = await Profile.collection.findOne({
      $or: [{ _id: legacyUser._id }, { cuentaId: legacyUser._id }],
    });

    let profileData;
    if (legacyUser.rol === 'instructor') {
      profileData = {
        tipoDocumento: legacyUser.tipoDocumento,
        documento: legacyUser.documento,
        especialidad: legacyUser.especialidad,
        fichasAsignadas: legacyUser.fichasAsignadas || [],
        estado: legacyUser.estado,
        centro: legacyUser.centro,
        avatar: legacyUser.avatar,
        horario: legacyUser.horario,
        promedioMetodologia: legacyUser.promedioMetodologia || 0,
        promedioTecnico: legacyUser.promedioTecnico || 0,
        promedioGeneral: legacyUser.promedioGeneral || 0,
        totalEvaluaciones: legacyUser.totalEvaluaciones || 0,
      };
    } else if (legacyUser.rol === 'aprendiz') {
      profileData = {
        tipoDocumento: legacyUser.tipoDocumento,
        documento: legacyUser.documento,
        fichas: await Enrollment.find({
          aprendizId: legacyUser._id,
          estado: 'activa',
        }).distinct('fichaId'),
      };
    } else if (legacyUser.rol === 'coordinador') {
      profileData = {
        tipoDocumento: legacyUser.tipoDocumento,
        documento: legacyUser.documento,
        centro: legacyUser.centro,
        area: legacyUser.especialidad || 'Coordinación Académica',
      };
    } else {
      throw new Error(`Rol no soportado para la cuenta ${legacyUser._id}.`);
    }

    const authFields = {
      nombre: legacyUser.nombre,
      email: legacyUser.email,
      password: isPasswordHash(legacyUser.password)
        ? legacyUser.password
        : await hashPassword(legacyUser.password),
      rol: legacyUser.rol,
      activo: legacyUser.activo !== false,
      authVersion: legacyUser.authVersion || 0,
    };
    if (existingProfile) {
      if (String(existingProfile._id) !== String(legacyUser._id)) {
        throw new Error(`El perfil ${existingProfile._id} no conserva el ID de ${legacyUser._id}.`);
      }
      await Profile.collection.updateOne(
        { _id: existingProfile._id },
        {
          $set: { ...authFields, ...profileData },
          $unset: { cuentaId: '' },
        }
      );
    } else {
      await Profile.create({
        _id: legacyUser._id,
        ...authFields,
        ...profileData,
      });
      migratedProfiles += 1;
    }
  }

  const profileCounts = await Promise.all([
    InstructorProfile.countDocuments({
      _id: { $in: legacyUsers.filter((user) => user.rol === 'instructor').map((user) => user._id) },
    }),
    LearnerProfile.countDocuments({
      _id: { $in: legacyUsers.filter((user) => user.rol === 'aprendiz').map((user) => user._id) },
    }),
    CoordinatorProfile.countDocuments({
      _id: { $in: legacyUsers.filter((user) => user.rol === 'coordinador').map((user) => user._id) },
    }),
  ]);
  const expectedProfiles = legacyUsers.length;
  if (profileCounts.reduce((total, count) => total + count, 0) !== expectedProfiles) {
    throw new Error('La verificación detectó perfiles faltantes después de la migración.');
  }
  for (const legacyUser of legacyUsers) {
    const Profile = getProfileModel(legacyUser.rol);
    const profile = await Profile.findById(legacyUser._id)
      .select('+password +authVersion')
      .lean();
    if (!profile || profile.email !== legacyUser.email || !isPasswordHash(profile.password)) {
      throw new Error(`La verificación detectó datos de acceso incompletos para ${legacyUser._id}.`);
    }
    if (legacyUser.rol === 'aprendiz') {
      const expectedFichaIds = (await Enrollment.find({
        aprendizId: legacyUser._id,
        estado: 'activa',
      }).distinct('fichaId')).map(String).sort();
      const learnerProfile = await LearnerProfile.findById(legacyUser._id)
        .select('fichas')
        .lean();
      const profileFichaIds = (learnerProfile?.fichas || []).map(String).sort();
      if (JSON.stringify(expectedFichaIds) !== JSON.stringify(profileFichaIds)) {
        throw new Error(`La verificación detectó fichas incompletas para el aprendiz ${legacyUser._id}.`);
      }
    }
  }
  if (process.argv[3] === '--delete-legacy') {
    if (process.env.ALLOW_LEGACY_USERS_DROP !== 'true') {
      throw new Error('Eliminar users requiere ALLOW_LEGACY_USERS_DROP=true.');
    }
    const legacyCollectionExists = await mongoose.connection.db
      .listCollections({ name: User.collection.collectionName })
      .hasNext();
    if (legacyCollectionExists) await User.collection.drop();
  }
  console.log(
    `Migración terminada. Perfiles nuevos: ${migratedProfiles}; total de perfiles verificados: ${profileCounts.reduce((total, count) => total + count, 0)}; colección users ${process.argv[3] === '--delete-legacy' ? 'eliminada' : 'conservada'}.`
  );
}

if (require.main === module) {
  migrateRoleCollections()
    .catch((error) => {
      console.error('[Role collection migration error]', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

module.exports = migrateRoleCollections;
