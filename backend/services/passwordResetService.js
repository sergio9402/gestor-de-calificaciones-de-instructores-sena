const { createHash, randomBytes } = require('node:crypto');
const PasswordResetToken = require('../models/PasswordResetToken');
const User = require('../models/User');
const emailService = require('../config/email');

const TOKEN_TTL_MS = 30 * 60 * 1000;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

class PasswordResetService {
  async requestReset(email) {
    emailService.getEmailConfig();

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      activo: { $ne: false },
    }).select('_id email');

    if (!user) return;

    const token = randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    let resetToken;
    try {
      resetToken = await PasswordResetToken.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            tokenHash,
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
            consumedAt: null,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      resetToken = await PasswordResetToken.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            tokenHash,
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
            consumedAt: null,
          },
        },
        { new: true }
      );
    }

    try {
      await emailService.sendPasswordResetEmail(user.email, token);
    } catch (error) {
      await PasswordResetToken.deleteOne({ _id: resetToken._id, tokenHash });
      throw error;
    }
  }

  async resetPassword(token, password) {
    const tokenHash = hashToken(token);
    const now = new Date();
    const resetToken = await PasswordResetToken.findOneAndUpdate(
      {
        tokenHash,
        expiresAt: { $gt: now },
        consumedAt: null,
      },
      { $set: { consumedAt: now } },
      { new: true }
    );

    if (!resetToken) {
      throw httpError(400, 'El enlace no es válido o ya venció. Solicita uno nuevo.');
    }

    const user = await User.findOne({
      _id: resetToken.userId,
      activo: { $ne: false },
    }).select('+password +authVersion');

    if (!user) {
      throw httpError(400, 'El enlace no es válido o ya venció. Solicita uno nuevo.');
    }

    user.password = password;
    user.authVersion = (user.authVersion || 0) + 1;
    await user.save();
    await PasswordResetToken.deleteMany({ userId: user._id });
  }
}

module.exports = new PasswordResetService();
