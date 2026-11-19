const { hashPassword, isPasswordHash } = require('../utils/password');

const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

function authFieldsForRole(role) {
  return {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El correo institucional es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailPattern, 'Ingresa un correo electrónico institucional válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false,
    },
    rol: {
      type: String,
      enum: [role],
      default: role,
      required: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    authVersion: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },
  };
}

function addPasswordHashHooks(schema) {
  schema.pre('save', async function hashModifiedPassword() {
    if (this.isModified('password') && !isPasswordHash(this.password)) {
      this.password = await hashPassword(this.password);
    }
  });

  schema.pre('findOneAndUpdate', async function hashUpdatedPassword() {
    const update = this.getUpdate() || {};
    const hasDirectPassword = Object.prototype.hasOwnProperty.call(update, 'password');
    const hasSetPassword = update.$set &&
      Object.prototype.hasOwnProperty.call(update.$set, 'password');
    const password = hasDirectPassword ? update.password : update.$set?.password;
    if ((hasDirectPassword || hasSetPassword) && !isPasswordHash(password)) {
      const hashedPassword = await hashPassword(password);
      if (hasSetPassword) update.$set.password = hashedPassword;
      else update.password = hashedPassword;
      this.setUpdate(update);
    }
  });
}

module.exports = { addPasswordHashHooks, authFieldsForRole };
