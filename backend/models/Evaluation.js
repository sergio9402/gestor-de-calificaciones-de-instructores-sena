const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InstructorProfile',
      required: [true, 'El ID del instructor a evaluar es obligatorio'],
      index: true,
    },
    fichaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ficha',
      index: true,
    },
    periodoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Period',
      index: true,
    },
    periodo: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    rubricVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
    calificacionMetodologia: {
      type: Number,
      min: [1, 'La calificación mínima en metodología es 1'],
      max: [5, 'La calificación máxima en metodología es 5'],
    },
    calificacionTecnica: {
      type: Number,
      min: [1, 'La calificación mínima en dominio técnico es 1'],
      max: [5, 'La calificación máxima en dominio técnico es 5'],
    },
    promedio: {
      type: Number,
      min: 1,
      max: 5,
    },
    comentario: {
      type: String,
      required: [true, 'El comentario constructivo es obligatorio'],
      trim: true,
      minlength: [10, 'El comentario debe contener al menos 10 caracteres'],
      maxlength: [1000, 'El comentario no puede exceder 1000 caracteres'],
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
    esAnonimo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Pre-save hook para calcular el promedio de la evaluación individual
evaluationSchema.pre('save', function calculateLegacyAverage() {
  if (
    Number.isFinite(this.calificacionMetodologia) &&
    Number.isFinite(this.calificacionTecnica)
  ) {
    this.promedio = Number(
      ((this.calificacionMetodologia + this.calificacionTecnica) / 2).toFixed(2)
    );
  }
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
