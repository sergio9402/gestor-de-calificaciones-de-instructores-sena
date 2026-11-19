const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    fichaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ficha',
      required: true,
      index: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InstructorProfile',
      required: true,
    },
    dia: {
      type: String,
      enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      required: true,
    },
    horaInicio: {
      type: String,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato de hora HH:mm'],
      required: true,
    },
    horaFin: {
      type: String,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato de hora HH:mm'],
      required: true,
    },
    tema: { type: String, trim: true, maxlength: 500, default: '' },
    ambiente: { type: String, trim: true, maxlength: 120, default: '' },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, collection: 'horarios' }
);

scheduleSchema.pre('validate', function validateTimeRange() {
  if (this.horaInicio && this.horaFin && this.horaInicio >= this.horaFin) {
    this.invalidate('horaFin', 'La hora de finalización debe ser posterior al inicio.');
  }
});

scheduleSchema.index({ fichaId: 1, dia: 1, horaInicio: 1 });
scheduleSchema.index({ instructor: 1, fichaId: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
