const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    fichaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ficha',
      required: true,
      index: true,
    },
    horarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
    },
    creadaPor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    rolCreador: {
      type: String,
      enum: ['coordinador', 'instructor'],
      required: true,
    },
    tipo: {
      type: String,
      enum: ['cancelacion', 'cambio_horario', 'cambio_ambiente', 'general'],
      required: true,
    },
    mensaje: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    fechaClase: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false, collection: 'novedades' }
);

announcementSchema.index({ fichaId: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
