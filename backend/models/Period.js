const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 30,
    },
    fechaInicio: Date,
    fechaFin: Date,
    estado: {
      type: String,
      enum: ['programado', 'activo', 'cerrado'],
      default: 'activo',
    },
  },
  { timestamps: true, versionKey: false, collection: 'periodos' }
);

periodSchema.pre('validate', function validateDateRange() {
  if (this.fechaInicio && this.fechaFin && this.fechaInicio > this.fechaFin) {
    this.invalidate('fechaFin', 'La fecha de finalización debe ser posterior al inicio.');
  }
});

module.exports = mongoose.model('Period', periodSchema);
