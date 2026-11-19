const mongoose = require('mongoose');

const evaluationAnswerSchema = new mongoose.Schema(
  {
    evaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evaluation',
      required: true,
    },
    criterionCode: {
      type: String,
      required: true,
      trim: true,
    },
    categoryCode: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      validate: {
        validator(value) {
          if (this.noAplica) return value === null || value === undefined;
          return Number.isInteger(value) && value >= 1 && value <= 5;
        },
        message: 'La calificación debe ser un número entero de 1 a 5.',
      },
    },
    noAplica: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false, timestamps: true }
);

evaluationAnswerSchema.index(
  { evaluationId: 1, criterionCode: 1 },
  { unique: true }
);
evaluationAnswerSchema.index({ categoryCode: 1, score: 1 });

evaluationAnswerSchema.pre('validate', function validateAnswer() {
  if (this.noAplica) {
    if (this.score !== null && this.score !== undefined) {
      this.invalidate('score', 'Una respuesta no aplicable no debe incluir calificación.');
    }
    return;
  }
  if (!Number.isInteger(this.score) || this.score < 1 || this.score > 5) {
    this.invalidate('score', 'La calificación debe ser un número entero de 1 a 5.');
  }
});

module.exports = mongoose.model('EvaluationAnswer', evaluationAnswerSchema);
