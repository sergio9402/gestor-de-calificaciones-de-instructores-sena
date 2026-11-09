const mongoose = require('mongoose');

const novedadSchema = new mongoose.Schema(
  {
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
    fechaClase: {
      type: Date,
      required: true,
    },
    creadaPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const sesionSchema = new mongoose.Schema(
  {
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
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tema: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    ambiente: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
  },
  { _id: false }
);

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
    periodo: {
      type: String,
      required: [true, 'El periodo de formación es obligatorio'],
      trim: true,
      maxlength: 30,
    },
    fechaInicio: {
      type: Date,
    },
    fechaFin: {
      type: Date,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El instructor es obligatorio'],
    },
    ambiente: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    dias: {
      type: [String],
      default: [],
    },
    horaInicio: {
      type: String,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato de hora HH:mm'],
      required: [true, 'La hora de inicio es obligatoria'],
    },
    horaFin: {
      type: String,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato de hora HH:mm'],
      required: [true, 'La hora de finalización es obligatoria'],
    },
    sesiones: {
      type: [sesionSchema],
      default: [],
    },
    aprendices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    activa: {
      type: Boolean,
      default: true,
    },
    novedades: {
      type: [novedadSchema],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

fichaSchema.pre('validate', function validateSchedule() {
  if (this.horaInicio && this.horaFin && this.horaInicio >= this.horaFin) {
    this.invalidate('horaFin', 'La hora de finalización debe ser posterior al inicio.');
  }
  if (this.fechaInicio && this.fechaFin && this.fechaInicio > this.fechaFin) {
    this.invalidate('fechaFin', 'La fecha de finalización debe ser posterior al inicio.');
  }
  if (Boolean(this.fechaInicio) !== Boolean(this.fechaFin)) {
    this.invalidate('fechaFin', 'Debes indicar las fechas de inicio y finalización.');
  }
  const sessionsByDay = new Map();
  for (const [index, session] of this.sesiones.entries()) {
    if (session.horaInicio >= session.horaFin) {
      this.invalidate(`sesiones.${index}.horaFin`, 'La hora de finalización debe ser posterior al inicio.');
    }
    const sessions = sessionsByDay.get(session.dia) || [];
    if (sessions.some((existing) =>
      session.horaInicio < existing.horaFin && session.horaFin > existing.horaInicio
    )) {
      this.invalidate(`sesiones.${index}.horaInicio`, 'Los bloques de un mismo día no pueden superponerse.');
    }
    sessions.push(session);
    sessionsByDay.set(session.dia, sessions);
  }
});

module.exports = mongoose.model('Ficha', fichaSchema);
