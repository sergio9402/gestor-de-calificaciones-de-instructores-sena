const mongoose = require('mongoose');

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
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingresa un correo electrónico institucional válido',
      ],
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
        values: ['instructor', 'coordinador'],
        message: 'El rol debe ser "instructor" o "coordinador"',
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

// Índice compuesto para acelerar búsquedas por rol y estado operativo
userSchema.index({ rol: 1, estado: 1 });

module.exports = mongoose.model('User', userSchema);

