const CoordinatorProfile = require('../models/CoordinatorProfile');
const InstructorProfile = require('../models/InstructorProfile');
const LearnerProfile = require('../models/LearnerProfile');

const profileModels = {
  instructor: InstructorProfile,
  coordinador: CoordinatorProfile,
  aprendiz: LearnerProfile,
};

function getProfileModel(role) {
  const model = profileModels[role];
  if (!model) throw new Error(`No existe un perfil para el rol "${role}".`);
  return model;
}

function sanitizeUserProfile(profile) {
  if (!profile) return null;
  const data = typeof profile.toObject === 'function' ? profile.toObject() : profile;
  const { password, authVersion, __v, ...publicData } = data;
  return publicData;
}

async function findProfileByEmail(email, role) {
  if (role && !Object.hasOwn(profileModels, role)) return null;
  const roles = role ? [role] : Object.keys(profileModels);
  const profiles = await Promise.all(roles.map((currentRole) =>
    getProfileModel(currentRole)
      .findOne({ email: email.toLowerCase().trim(), activo: { $ne: false } })
      .select('+password +authVersion')
  ));
  return profiles.find(Boolean) || null;
}

async function findProfileById(id, role, select = '') {
  if (role) return getProfileModel(role).findById(id).select(select);
  const profiles = await Promise.all(
    Object.values(profileModels).map((Profile) => Profile.findById(id).select(select))
  );
  return profiles.find(Boolean) || null;
}

async function createUserProfile(userData, roleProfileData = {}) {
  const Profile = getProfileModel(userData.rol);
  await assertEmailAvailable(userData.email);
  return sanitizeUserProfile(await Profile.create({
    ...roleProfileData,
    ...userData,
    email: userData.email.toLowerCase().trim(),
  }));
}

async function assertEmailAvailable(email, excludeId) {
  const filter = { email: email.toLowerCase().trim() };
  if (excludeId) filter._id = { $ne: excludeId };
  const existingEmail = await Promise.all(
    Object.values(profileModels).map((Model) => Model.exists(filter))
  );
  if (existingEmail.some(Boolean)) {
    const error = new Error('Ya existe un usuario con este correo electrónico.');
    error.code = 11000;
    error.keyPattern = { email: 1 };
    throw error;
  }
}

module.exports = {
  assertEmailAvailable,
  createUserProfile,
  findProfileByEmail,
  findProfileById,
  getProfileModel,
  profileModels,
  sanitizeUserProfile,
};
