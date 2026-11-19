const mongoose = require('mongoose');
const { addPasswordHashHooks, authFieldsForRole } = require('./profileAuthFields');

const coordinatorProfileSchema = new mongoose.Schema(
  {
    ...authFieldsForRole('coordinador'),
    tipoDocumento: { type: String, enum: ['CC', 'TI'], default: null },
    documento: {
      type: String,
      trim: true,
      match: [/^\d{6,15}$/, 'El documento debe contener entre 6 y 15 dígitos.'],
      default: null,
    },
    centro: { type: String, trim: true, default: 'Centro de Formación SENA' },
    area: { type: String, trim: true, default: 'Coordinación Académica' },
  },
  { timestamps: true, versionKey: false, collection: 'coordinadores' }
);

addPasswordHashHooks(coordinatorProfileSchema);

coordinatorProfileSchema.index(
  { tipoDocumento: 1, documento: 1 },
  { unique: true, partialFilterExpression: { documento: { $type: 'string' } } }
);

module.exports = mongoose.model('CoordinatorProfile', coordinatorProfileSchema);
