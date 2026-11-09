const mongoose = require('mongoose');

const evaluationParticipationSchema = new mongoose.Schema(
  {
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fichaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ficha',
      required: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    periodo: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

evaluationParticipationSchema.index(
  { learnerId: 1, fichaId: 1, periodo: 1, instructorId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'EvaluationParticipation',
  evaluationParticipationSchema
);
