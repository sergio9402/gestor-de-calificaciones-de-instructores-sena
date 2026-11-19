const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const test = require('node:test');
const CoordinatorProfile = require('../models/CoordinatorProfile');
const InstructorProfile = require('../models/InstructorProfile');
const LearnerProfile = require('../models/LearnerProfile');
const PasswordResetToken = require('../models/PasswordResetToken');
const emailService = require('../config/email');
const passwordResetService = require('../services/passwordResetService');
const { verifyPassword } = require('../utils/password');

test('password recovery finds and resets instructor, learner, and coordinator profiles', async (t) => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('password-reset-roles-test'));

  const originalGetEmailConfig = emailService.getEmailConfig;
  const originalSendPasswordResetEmail = emailService.sendPasswordResetEmail;
  const sentEmails = [];
  emailService.getEmailConfig = () => ({});
  emailService.sendPasswordResetEmail = async (email, token) => {
    sentEmails.push({ email, token });
  };

  t.after(async () => {
    emailService.getEmailConfig = originalGetEmailConfig;
    emailService.sendPasswordResetEmail = originalSendPasswordResetEmail;
    await mongoose.disconnect();
    await mongo.stop();
  });

  const profiles = [
    { Model: InstructorProfile, rol: 'instructor', email: 'instructor@example.test' },
    { Model: LearnerProfile, rol: 'aprendiz', email: 'aprendiz@example.test' },
    { Model: CoordinatorProfile, rol: 'coordinador', email: 'coordinacion@example.test' },
  ];
  for (const { Model, rol, email } of profiles) {
    await Model.create({
      nombre: `Usuario ${rol}`,
      email,
      password: 'ClaveAnterior-Segura-2026',
      rol,
    });
  }

  for (const { email } of profiles) {
    await passwordResetService.requestReset(email);
  }
  assert.deepEqual(
    sentEmails.map(({ email }) => email),
    profiles.map(({ email }) => email)
  );

  for (const { Model, email } of profiles) {
    const sentEmail = sentEmails.find((record) => record.email === email);
    await passwordResetService.resetPassword(sentEmail.token, 'NuevaClave-Segura-2026');

    const profile = await Model.findOne({ email }).select('+password +authVersion');
    assert.equal(await verifyPassword('NuevaClave-Segura-2026', profile.password), true);
    assert.equal(profile.authVersion, 1);
    assert.equal(await PasswordResetToken.countDocuments({ userId: profile._id }), 0);
  }
});
