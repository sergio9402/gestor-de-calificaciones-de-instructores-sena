const mongoose = require('mongoose');
const { addPasswordHashHooks, authFieldsForRole } = require('./profileAuthFields');

const instructorProfileSchema = new mongoose.Schema(
  {
    ...authFieldsForRole('instructor'),
    tipoDocumento: { type: String, enum: ['CC', 'TI'], default: null },
    documento: {
      type: String,
      trim: true,
      match: [/^\d{6,15}$/, 'El documento debe contener entre 6 y 15 dígitos.'],
      default: null,
    },
    especialidad: {
      type: String,
      trim: true,
      default: 'Formación Profesional Integral',
    },
    fichasAsignadas: { type: [String], default: [] },
    estado: {
      type: String,
      enum: ['En Formación', 'Asesoría Técnica', 'Disponible', 'En Reunión'],
      default: 'Disponible',
    },
    centro: { type: String, trim: true, default: 'Centro de Formación SENA' },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    horario: { type: String, default: '07:00 AM - 01:00 PM' },
    promedioMetodologia: { type: Number, default: 0, min: 0, max: 5 },
    promedioTecnico: { type: Number, default: 0, min: 0, max: 5 },
    promedioGeneral: { type: Number, default: 0, min: 0, max: 5 },
    totalEvaluaciones: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false, collection: 'instructores' }
);

addPasswordHashHooks(instructorProfileSchema);

instructorProfileSchema.index(
  { tipoDocumento: 1, documento: 1 },
  { unique: true, partialFilterExpression: { documento: { $type: 'string' } } }
);

module.exports = mongoose.model('InstructorProfile', instructorProfileSchema);
