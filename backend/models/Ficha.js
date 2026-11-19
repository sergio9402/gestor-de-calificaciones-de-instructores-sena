const mongoose = require('mongoose');

const fichaSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: [true, 'El código de ficha es obligatorio'],
      trim: true,
      unique: true,
      maxlength: 30,
    },
    programa: {
      type: String,
      required: [true, 'El programa de formación es obligatorio'],
      trim: true,
      maxlength: 160,
    },
    periodoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Period',
      required: [true, 'El periodo de formación es obligatorio'],
      index: true,
    },
    fechaInicio: Date,
    fechaFin: Date,
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InstructorProfile',
      required: [true, 'El instructor es obligatorio'],
    },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, collection: 'fichas' }
);

fichaSchema.pre('validate', function validateDateRange() {
  if (this.fechaInicio && this.fechaFin && this.fechaInicio > this.fechaFin) {
    this.invalidate('fechaFin', 'La fecha de finalización debe ser posterior al inicio.');
  }
  if (Boolean(this.fechaInicio) !== Boolean(this.fechaFin)) {
    this.invalidate('fechaFin', 'Debes indicar las fechas de inicio y finalización.');
  }
});

module.exports = mongoose.model('Ficha', fichaSchema);
