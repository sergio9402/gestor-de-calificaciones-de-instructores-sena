const mongoose = require('mongoose');
const { hashPassword, isPasswordHash } = require('../utils/password');

const userSchema = new mongoose.Schema(
  {
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
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Por favor ingresa un correo electrónico institucional válido',
      ],
    },
    tipoDocumento: {
      type: String,
      enum: ['CC', 'TI'],
    },
    documento: {
      type: String,
      trim: true,
      match: [/^\d{6,15}$/, 'El documento debe contener entre 6 y 15 dígitos.'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // Por seguridad no se incluye en consultas por defecto
    },
    rol: {
      type: String,
      required: [true, 'El rol es obligatorio'],
      enum: {
        values: ['instructor', 'coordinador', 'aprendiz'],
        message: 'El rol debe ser "instructor", "coordinador" o "aprendiz"',
      },
    },
    especialidad: {
      type: String,
      trim: true,
      default: 'Formación Profesional Integral',
    },
    fichasAsignadas: {
      type: [String],
      default: [],
    },
    fichasInscritas: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ficha',
    }],
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
    estado: {
      type: String,
      enum: {
        values: ['En Formación', 'Asesoría Técnica', 'Disponible', 'En Reunión'],
        message: 'Estado operativo no válido',
      },
      default: 'Disponible',
    },
    centro: {
      type: String,
      trim: true,
      default: 'Centro de Formación SENA',
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    horario: {
      type: String,
      default: '07:00 AM - 01:00 PM',
    },
    // Métricas acumuladas y recalculadas automáticamente
    promedioMetodologia: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    promedioTecnico: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    promedioGeneral: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    totalEvaluaciones: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.pre('save', async function hashModifiedPassword() {
  if (this.isModified('password') && !isPasswordHash(this.password)) {
    this.password = await hashPassword(this.password);
  }
});

userSchema.pre('findOneAndUpdate', async function hashUpdatedPassword() {
  const update = this.getUpdate();
  const hasDirectPassword = Object.prototype.hasOwnProperty.call(update, 'password');
  const hasSetPassword =
    update.$set &&
    Object.prototype.hasOwnProperty.call(update.$set, 'password');
  const password = hasDirectPassword ? update.password : update.$set?.password;
  if ((hasDirectPassword || hasSetPassword) && !isPasswordHash(password)) {
    const hashedPassword = await hashPassword(password);
    if (hasSetPassword) update.$set.password = hashedPassword;
    else update.password = hashedPassword;
    this.setUpdate(update);
  }
});

// Índice compuesto para acelerar búsquedas por rol y estado operativo
userSchema.index({ rol: 1, estado: 1 });
userSchema.index(
  { tipoDocumento: 1, documento: 1 },
  { unique: true, partialFilterExpression: { documento: { $type: 'string' } } }
);

module.exports = mongoose.model('User', userSchema);
