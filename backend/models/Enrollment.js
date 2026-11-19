const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    aprendizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearnerProfile',
      required: true,
    },
    fichaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ficha',
      required: true,
    },
    fechaInscripcion: { type: Date, default: Date.now },
    estado: {
      type: String,
      enum: ['activa', 'retirada', 'finalizada'],
      default: 'activa',
    },
  },
  { timestamps: true, versionKey: false, collection: 'inscripciones' }
);

enrollmentSchema.index({ aprendizId: 1, fichaId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
