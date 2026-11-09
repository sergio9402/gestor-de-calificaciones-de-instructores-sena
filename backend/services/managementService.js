const Ficha = require('../models/Ficha');
const EvaluationParticipation = require('../models/EvaluationParticipation');
const User = require('../models/User');

const USER_FIELDS = [
  'nombre',
  'email',
  'rol',
  'especialidad',
  'centro',
  'estado',
  'avatar',
  'horario',
  'fichasAsignadas',
  'tipoDocumento',
  'documento',
];
const USER_UPDATE_FIELDS = USER_FIELDS.filter((field) => field !== 'rol');
const FICHA_FIELDS = [
  'codigo',
  'programa',
  'periodo',
  'fechaInicio',
  'fechaFin',
  'instructor',
  'ambiente',
  'dias',
  'horaInicio',
  'horaFin',
  'sesiones',
  'aprendices',
];

const pick = (source, allowedFields) =>
  Object.fromEntries(
    allowedFields
      .filter((field) => Object.prototype.hasOwnProperty.call(source, field))
      .map((field) => [field, source[field]])
  );

const httpError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

function validateLearnerDocument(data, allowMissing = true) {
  const hasDocument = Boolean(data.documento);
  const hasType = Boolean(data.tipoDocumento);
  if (!hasDocument && !hasType && allowMissing) return;
  if (
    !hasDocument ||
    !hasType ||
    !['CC', 'TI'].includes(data.tipoDocumento) ||
    !/^\d{6,15}$/.test(String(data.documento || ''))
  ) {
    throw httpError(400, 'Indica un tipo de documento válido y un número de 6 a 15 dígitos.');
  }
}

function validateFichaSchedule(payload, existingFicha = null) {
  const fechaInicio = Object.prototype.hasOwnProperty.call(payload, 'fechaInicio')
    ? payload.fechaInicio
    : existingFicha?.fechaInicio;
  const fechaFin = Object.prototype.hasOwnProperty.call(payload, 'fechaFin')
    ? payload.fechaFin
    : existingFicha?.fechaFin;
  if (Boolean(fechaInicio) !== Boolean(fechaFin)) {
    throw httpError(400, 'Debes indicar las fechas de inicio y finalización.');
  }
  if (fechaInicio && (
    Number.isNaN(new Date(fechaInicio).getTime()) ||
    Number.isNaN(new Date(fechaFin).getTime()) ||
    new Date(fechaInicio) > new Date(fechaFin)
  )) {
    throw httpError(400, 'El rango de fechas de la ficha no es válido.');
  }

  const sessions = Object.prototype.hasOwnProperty.call(payload, 'sesiones')
    ? payload.sesiones
    : existingFicha?.sesiones || [];
  if (!Array.isArray(sessions)) {
    throw httpError(400, 'La lista de bloques horarios no es válida.');
  }
  const validDays = new Set(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
  const sessionsByDay = new Map();
  for (const [index, session] of sessions.entries()) {
    if (!session || typeof session !== 'object' || Array.isArray(session)) {
      throw httpError(400, `El bloque horario ${index + 1} no es válido.`);
    }
    if (
      typeof session.horaInicio !== 'string' ||
      typeof session.horaFin !== 'string' ||
      !validDays.has(session.dia) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(session.horaInicio) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(session.horaFin) ||
      session.horaInicio >= session.horaFin
    ) {
      throw httpError(400, `El bloque horario ${index + 1} tiene un intervalo inválido.`);
    }
    const sameDay = sessionsByDay.get(session.dia) || [];
    if (sameDay.some((other) =>
      session.horaInicio < other.horaFin && session.horaFin > other.horaInicio
    )) {
      throw httpError(400, `Los bloques del día ${session.dia} no pueden superponerse.`);
    }
    sameDay.push(session);
    sessionsByDay.set(session.dia, sameDay);
  }
}

class ManagementService {
  async listUsers(role) {
    const filter = {
      rol: { $in: ['instructor', 'aprendiz'] },
      activo: { $ne: false },
    };
    if (role && ['instructor', 'aprendiz'].includes(role)) filter.rol = role;
    return User.find(filter)
      .select('nombre email rol especialidad centro estado fichasAsignadas fichasInscritas activo tipoDocumento documento')
      .populate('fichasInscritas', 'codigo programa')
      .sort({ nombre: 1 })
      .lean();
  }

  async createUser(data) {
    const { rol, password } = data;
    if (!['instructor', 'aprendiz'].includes(rol)) {
      throw httpError(400, 'Solo se pueden crear cuentas de instructor o aprendiz.');
    }
    if (typeof password !== 'string' || password.length < 12) {
      throw httpError(400, 'La contraseña inicial debe tener al menos 12 caracteres.');
    }
    if (rol === 'aprendiz') validateLearnerDocument(data);

    const user = await User.create({
      ...pick(data, USER_FIELDS),
      password,
      activo: true,
    });
    return User.findById(user._id).select('-password');
  }

  async updateUser(id, data) {
    if (
      Object.prototype.hasOwnProperty.call(data, 'documento') ||
      Object.prototype.hasOwnProperty.call(data, 'tipoDocumento')
    ) {
      validateLearnerDocument(data, false);
    }
    const update = pick(data, USER_UPDATE_FIELDS);
    if (Object.prototype.hasOwnProperty.call(data, 'password')) {
      if (typeof data.password !== 'string' || data.password.length < 12) {
        throw httpError(400, 'La nueva contraseña debe tener al menos 12 caracteres.');
      }
      update.password = data.password;
    }
    if (Object.keys(update).length === 0) {
      throw httpError(400, 'No hay campos válidos para actualizar.');
    }

    const user = await User.findOneAndUpdate(
      {
        _id: id,
        rol: { $in: ['instructor', 'aprendiz'] },
        activo: { $ne: false },
      },
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) throw httpError(404, 'Usuario no encontrado.');
    return user;
  }

  async deactivateUser(id) {
    const existing = await User.findOne({
      _id: id,
      rol: { $in: ['instructor', 'aprendiz'] },
      activo: { $ne: false },
    }).select('_id rol');
    if (!existing) throw httpError(404, 'Usuario no encontrado.');
    if (
      existing.rol === 'instructor' &&
      await Ficha.exists({
        activa: true,
        $or: [{ instructor: existing._id }, { 'sesiones.instructor': existing._id }],
      })
    ) {
      throw httpError(
        409,
        'Reasigna o desactiva primero las fichas activas de este instructor.'
      );
    }

    const user = await User.findOneAndUpdate(
      { _id: id, rol: { $in: ['instructor', 'aprendiz'] }, activo: { $ne: false } },
      { $set: { activo: false } },
      { new: true }
    ).select('_id nombre rol activo');
    if (!user) throw httpError(404, 'Usuario no encontrado.');

    if (user.rol === 'aprendiz') {
      await Ficha.updateMany(
        { aprendices: user._id },
        { $pull: { aprendices: user._id } }
      );
    }
    return user;
  }

  async listFichas() {
    return Ficha.find({ activa: true })
      .populate('instructor', 'nombre email especialidad promedioGeneral totalEvaluaciones')
      .populate('sesiones.instructor', 'nombre email especialidad promedioGeneral totalEvaluaciones')
      .populate('aprendices', 'nombre email')
      .sort({ codigo: 1 })
      .lean();
  }

  async createFicha(data) {
    const payload = pick(data, FICHA_FIELDS);
    validateFichaSchedule(payload);
    await this.validateFichaReferences(payload);
    const ficha = await Ficha.create(payload);
    await this.syncInstructorFicha(ficha);
    return ficha;
  }

  async updateFicha(id, data) {
    const previousFicha = await Ficha.findOne({ _id: id, activa: true });
    if (!previousFicha) throw httpError(404, 'Ficha no encontrada.');
    const payload = pick(data, FICHA_FIELDS);
    if (Object.keys(payload).length === 0) {
      throw httpError(400, 'No hay campos válidos para actualizar.');
    }
    validateFichaSchedule(payload, previousFicha);
    await this.validateFichaReferences(payload, previousFicha);
    const ficha = await Ficha.findOneAndUpdate(
      { _id: id, activa: true },
      { $set: payload },
      { new: true, runValidators: true }
    );
    if (!ficha) throw httpError(404, 'Ficha no encontrada.');
    await this.syncInstructorFicha(ficha, previousFicha);
    return ficha;
  }

  async deactivateFicha(id) {
    const ficha = await Ficha.findOneAndUpdate(
      { _id: id, activa: true },
      { $set: { activa: false } },
      { new: true }
    );
    if (!ficha) throw httpError(404, 'Ficha no encontrada.');
    await User.updateMany(
      { rol: 'instructor' },
      { $pull: { fichasAsignadas: ficha.codigo } }
    );
    return ficha;
  }

  async addNovedad(fichaId, actor, data) {
    const ficha = await Ficha.findOne({ _id: fichaId, activa: true });
    if (!ficha) throw httpError(404, 'Ficha no encontrada.');
    if (
      actor.rol !== 'coordinador' &&
      String(ficha.instructor) !== String(actor._id) &&
      !ficha.sesiones.some((session) => String(session.instructor) === String(actor._id))
    ) {
      throw httpError(403, 'Solo coordinación o el instructor asignado puede reportar novedades.');
    }
    if (!data.tipo || !data.mensaje || !data.fechaClase) {
      throw httpError(400, 'Tipo, mensaje y fecha de clase son obligatorios.');
    }
    ficha.novedades.push({
      tipo: data.tipo,
      mensaje: data.mensaje,
      fechaClase: data.fechaClase,
      creadaPor: actor._id,
    });
    await ficha.save();
    return ficha.novedades[ficha.novedades.length - 1];
  }

  async getLearnerSchedule(learnerId) {
    const fichas = await Ficha.find({
      aprendices: learnerId,
      activa: true,
    })
      .populate(
        'instructor',
        'nombre especialidad centro estado promedioGeneral totalEvaluaciones'
      )
      .populate(
        'sesiones.instructor',
        'nombre especialidad centro estado promedioGeneral totalEvaluaciones'
      )
      .sort({ codigo: 1 })
      .lean();
    const participations = await EvaluationParticipation.find({
      learnerId,
      fichaId: { $in: fichas.map((ficha) => ficha._id) },
    }).select('fichaId periodo instructorId');
    const submitted = new Set(participations.map((participation) =>
      `${participation.fichaId}:${participation.periodo}:${participation.instructorId}`
    ));
    return fichas.map((ficha) => ({
      ...ficha,
      instructoresEvaluados: [...new Set(
        participations
          .filter((participation) =>
            String(participation.fichaId) === String(ficha._id) &&
            participation.periodo === ficha.periodo
          )
          .map((participation) => String(participation.instructorId))
      )],
      yaEvaluo: submitted.has(`${ficha._id}:${ficha.periodo}:${ficha.instructor?._id || ficha.instructor}`),
      novedades: ficha.novedades.sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
      ),
    }));
  }

  async getInstructorFichas(instructorId) {
    const fichas = await Ficha.find({
      $or: [{ instructor: instructorId }, { 'sesiones.instructor': instructorId }],
      activa: true,
    })
      .sort({ codigo: 1 })
      .lean();
    if (fichas.length === 0) return [];
    const participationCounts = await EvaluationParticipation.aggregate([
      {
        $match: {
          fichaId: { $in: fichas.map((ficha) => ficha._id) },
          periodo: { $in: [...new Set(fichas.map((ficha) => ficha.periodo))] },
        },
      },
      {
        $group: {
          _id: {
            fichaId: '$fichaId',
            periodo: '$periodo',
            instructorId: '$instructorId',
          },
          total: { $sum: 1 },
        },
      },
    ]);
    const totalsByFichaAndPeriod = new Map(
      participationCounts.map(({ _id, total }) => [
        `${_id.fichaId}:${_id.periodo}:${_id.instructorId}`,
        total,
      ])
    );

    return fichas.map((ficha) => ({
      ...ficha,
      sesiones: ficha.sesiones.filter(
        (session) => String(session.instructor) === String(instructorId)
      ),
      totalAprendices: ficha.aprendices.length,
      totalEvaluaciones:
        totalsByFichaAndPeriod.get(`${ficha._id}:${ficha.periodo}:${instructorId}`) || 0,
    }));
  }

  async validateFichaReferences(payload, existingFicha = null) {
    if (payload.instructor) {
      const instructor = await User.findOne({
        _id: payload.instructor,
        rol: 'instructor',
        activo: { $ne: false },
      });
      if (!instructor) throw httpError(400, 'El instructor asignado no existe o está inactivo.');
    }
    if (payload.sesiones !== undefined) {
      if (!Array.isArray(payload.sesiones)) {
        throw httpError(400, 'La lista de bloques horarios no es válida.');
      }
      if (payload.sesiones.some((session) =>
        !session || typeof session !== 'object' || Array.isArray(session)
      )) {
        throw httpError(400, 'Cada bloque horario debe ser un objeto válido.');
      }
      const instructorIds = [...new Set(payload.sesiones.map((session) => String(session.instructor)))];
      if (instructorIds.some((id) => !id || id === 'undefined' || id === 'null')) {
        throw httpError(400, 'Cada bloque debe tener un instructor asignado.');
      }
      const instructors = await User.find({
        _id: { $in: instructorIds },
        rol: 'instructor',
        activo: { $ne: false },
      }).select('_id');
      if (instructors.length !== instructorIds.length) {
        throw httpError(400, 'Todos los instructores de los bloques deben existir y estar activos.');
      }
    }
    const sessions = Object.prototype.hasOwnProperty.call(payload, 'sesiones')
      ? payload.sesiones
      : existingFicha?.sesiones || [];
    const primaryInstructor = payload.instructor || existingFicha?.instructor;
    if (
      sessions.length > 0 &&
      !sessions.some((session) =>
        String(session.instructor) === String(primaryInstructor)
      )
    ) {
      throw httpError(400, 'El instructor principal de la ficha debe estar asignado a uno de sus bloques.');
    }
    if (payload.aprendices) {
      if (!Array.isArray(payload.aprendices)) {
        throw httpError(400, 'La lista de aprendices no es válida.');
      }
      const learners = await User.find({
        _id: { $in: payload.aprendices },
        rol: 'aprendiz',
        activo: true,
      }).select('_id');
      if (learners.length !== new Set(payload.aprendices.map(String)).size) {
        throw httpError(400, 'Todos los aprendices asignados deben existir y estar activos.');
      }
    }
  }

  async syncInstructorFicha(ficha, previousFicha = null) {
    if (previousFicha) {
      await User.updateMany(
        {
          rol: 'instructor',
          fichasAsignadas: previousFicha.codigo,
        },
        { $pull: { fichasAsignadas: previousFicha.codigo } }
      );
    }
    const instructorIds = [...new Set([
      String(ficha.instructor),
      ...ficha.sesiones.map((session) => String(session.instructor)),
    ])];
    await User.updateMany(
      { rol: 'instructor', _id: { $nin: instructorIds }, fichasAsignadas: ficha.codigo },
      { $pull: { fichasAsignadas: ficha.codigo } }
    );
    await User.updateMany(
      { _id: { $in: instructorIds } },
      { $addToSet: { fichasAsignadas: ficha.codigo } }
    );
  }
}

module.exports = new ManagementService();
