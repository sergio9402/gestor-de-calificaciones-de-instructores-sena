const mongoose = require('mongoose');
const { addPasswordHashHooks, authFieldsForRole } = require('./profileAuthFields');

const learnerProfileSchema = new mongoose.Schema(
  {
    ...authFieldsForRole('aprendiz'),
    tipoDocumento: { type: String, enum: ['CC', 'TI'], default: null },
    documento: {
      type: String,
      trim: true,
      match: [/^\d{6,15}$/, 'El documento debe contener entre 6 y 15 dígitos.'],
      default: null,
    },
    fichas: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ficha',
    }],
  },
  { timestamps: true, versionKey: false, collection: 'aprendices' }
);

addPasswordHashHooks(learnerProfileSchema);

learnerProfileSchema.index(
  { tipoDocumento: 1, documento: 1 },
  { unique: true, partialFilterExpression: { documento: { $type: 'string' } } }
);

module.exports = mongoose.model('LearnerProfile', learnerProfileSchema);
