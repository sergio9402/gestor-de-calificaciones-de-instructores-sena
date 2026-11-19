const Ficha = require('../models/Ficha');
const Announcement = require('../models/Announcement');
const Enrollment = require('../models/Enrollment');
const EvaluationParticipation = require('../models/EvaluationParticipation');
const CoordinatorProfile = require('../models/CoordinatorProfile');
const InstructorProfile = require('../models/InstructorProfile');
const LearnerProfile = require('../models/LearnerProfile');
const Period = require('../models/Period');
const Schedule = require('../models/Schedule');
const {
  assertEmailAvailable,
  createUserProfile,
  getProfileModel,
  sanitizeUserProfile,
} = require('./userProfileService');

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

async function populateProfileAccounts(fichas) {
  if (!fichas.length) return [];
  const fichaIds = fichas.map((ficha) => ficha._id);
  const [periods, schedules, enrollments, announcements] = await Promise.all([
    Period.find({ _id: { $in: fichas.map((ficha) => ficha.periodoId).filter(Boolean) } }).lean(),
    Schedule.find({ fichaId: { $in: fichaIds }, activa: true })
      .populate({ path: 'instructor', select: '-password -authVersion' })
      .sort({ dia: 1, horaInicio: 1 })
      .lean(),
    Enrollment.find({ fichaId: { $in: fichaIds }, estado: 'activa' })
      .populate({ path: 'aprendizId', select: '-password -authVersion' })
      .lean(),
    Announcement.find({ fichaId: { $in: fichaIds } })
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const authorIds = [...new Set(announcements.map((announcement) => String(announcement.creadaPor)))];
  const [instructorAuthors, coordinatorAuthors] = await Promise.all([
    InstructorProfile.find({ _id: { $in: authorIds } }).select('nombre email rol').lean(),
    CoordinatorProfile.find({ _id: { $in: authorIds } }).select('nombre email rol').lean(),
  ]);
  const authorsById = new Map(
    [...instructorAuthors, ...coordinatorAuthors].map((author) => [String(author._id), author])
  );
  const periodById = new Map(periods.map((period) => [String(period._id), period]));
  const schedulesByFicha = new Map();
  for (const schedule of schedules) {
    const records = schedulesByFicha.get(String(schedule.fichaId)) || [];
    records.push(schedule);
    schedulesByFicha.set(String(schedule.fichaId), records);
  }
  const learnersByFicha = new Map();
  for (const enrollment of enrollments) {
    const learner = enrollment.aprendizId;
    if (!learner) continue;
    const records = learnersByFicha.get(String(enrollment.fichaId)) || [];
    records.push(learner);
    learnersByFicha.set(String(enrollment.fichaId), records);
  }
  const announcementsByFicha = new Map();
  for (const announcement of announcements) {
    const records = announcementsByFicha.get(String(announcement.fichaId)) || [];
    records.push({
      ...announcement,
      creadaPor: authorsById.get(String(announcement.creadaPor)) || announcement.creadaPor,
    });
    announcementsByFicha.set(String(announcement.fichaId), records);
  }
  return fichas.map((ficha) => {
    const sessions = schedulesByFicha.get(String(ficha._id)) || [];
    const period = periodById.get(String(ficha.periodoId));
    const instructor = ficha.instructor;
    return {
      ...ficha,
      periodo: period?.nombre || '',
      instructor,
      sesiones: sessions,
      aprendices: learnersByFicha.get(String(ficha._id)) || [],
      novedades: announcementsByFicha.get(String(ficha._id)) || [],
      dias: [...new Set(sessions.map((session) => session.dia))],
      horaInicio: sessions.map((session) => session.horaInicio).sort()[0] || '',
      horaFin: sessions.map((session) => session.horaFin).sort().at(-1) || '',
      ambiente: sessions[0]?.ambiente || '',
    };
  });
}

async function findOrCreatePeriod(nombre, fechaInicio, fechaFin) {
  const periodData = { nombre: nombre.trim() };
  if (fechaInicio) periodData.fechaInicio = fechaInicio;
  if (fechaFin) periodData.fechaFin = fechaFin;
  return Period.findOneAndUpdate(
    { nombre: nombre.trim() },
    { $setOnInsert: periodData },
    { new: true, upsert: true, runValidators: true }
  );
}

function makeSchedules(payload, primaryInstructor) {
  if (Array.isArray(payload.sesiones) && payload.sesiones.length) return payload.sesiones;
  return (payload.dias || []).map((dia) => ({
    dia,
    horaInicio: payload.horaInicio,
    horaFin: payload.horaFin,
    instructor: primaryInstructor,
    tema: '',
    ambiente: payload.ambiente || '',
  }));
}

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
  const horaInicio = Object.prototype.hasOwnProperty.call(payload, 'horaInicio')
    ? payload.horaInicio
    : existingFicha?.horaInicio;
  const horaFin = Object.prototype.hasOwnProperty.call(payload, 'horaFin')
    ? payload.horaFin
    : existingFicha?.horaFin;
  if (
    (horaInicio || horaFin) &&
    (
      typeof horaInicio !== 'string' ||
      typeof horaFin !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(horaInicio) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(horaFin) ||
      horaInicio >= horaFin
    )
  ) {
    throw httpError(400, 'El horario de la ficha no es válido.');
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
    const roles = role && ['instructor', 'aprendiz'].includes(role) ? [role] : ['instructor', 'aprendiz'];
    const [instructors, learners] = await Promise.all([
      roles.includes('instructor')
        ? InstructorProfile.find({ activo: { $ne: false } }).sort({ nombre: 1 }).lean()
        : [],
      roles.includes('aprendiz')
        ? LearnerProfile.find({ activo: { $ne: false } }).sort({ nombre: 1 }).lean()
        : [],
    ]);
    return [...instructors, ...learners]
      .sort((left, right) => left.nombre.localeCompare(right.nombre, 'es', { sensitivity: 'base' }))
      .map(sanitizeUserProfile);
  }

  async createUser(data) {
    const { rol, password } = data;
    if (!['instructor', 'aprendiz'].includes(rol)) {
      throw httpError(400, 'Solo se pueden crear cuentas de instructor o aprendiz.');
    }
    if (typeof password !== 'string' || password.length < 12) {
      throw httpError(400, 'La contraseña inicial debe tener al menos 12 caracteres.');
    }
    if (rol === 'aprendiz' || data.documento || data.tipoDocumento) {
      validateLearnerDocument(data);
    }

    const userData = {
      nombre: data.nombre,
      email: data.email,
      rol,
      password,
      activo: true,
    };
    const profileFields = rol === 'instructor'
      ? ['especialidad', 'centro', 'avatar', 'horario', 'tipoDocumento', 'documento']
      : ['tipoDocumento', 'documento'];
    return createUserProfile(userData, pick(data, profileFields));
  }

  async updateUser(id, data) {
    const [instructor, learner] = await Promise.all([
      InstructorProfile.findOne({ _id: id, activo: { $ne: false } }),
      LearnerProfile.findOne({ _id: id, activo: { $ne: false } }),
    ]);
    const profile = instructor || learner;
    if (!profile) throw httpError(404, 'Usuario no encontrado.');
    const profileFields = profile.rol === 'instructor'
      ? ['nombre', 'email', 'especialidad', 'centro', 'estado', 'avatar', 'horario', 'fichasAsignadas', 'tipoDocumento', 'documento']
      : ['nombre', 'email', 'tipoDocumento', 'documento'];
    if ((
      profile.rol === 'aprendiz' ||
      profile.rol === 'instructor'
    ) && (
      Object.prototype.hasOwnProperty.call(data, 'documento') ||
      Object.prototype.hasOwnProperty.call(data, 'tipoDocumento')
    )) {
      validateLearnerDocument(data, false);
    }
    const update = pick(data, profileFields);
    if (Object.prototype.hasOwnProperty.call(data, 'password')) {
      if (typeof data.password !== 'string' || data.password.length < 12) {
        throw httpError(400, 'La nueva contraseña debe tener al menos 12 caracteres.');
      }
      update.password = data.password;
    }
    if (Object.keys(update).length === 0) {
      throw httpError(400, 'No hay campos válidos para actualizar.');
    }
    if (typeof update.email === 'string') {
      await assertEmailAvailable(update.email, profile._id);
    }
    Object.assign(profile, update);
    await profile.save();
    return sanitizeUserProfile(profile);
  }

  async deactivateUser(id) {
    const [instructor, learner] = await Promise.all([
      InstructorProfile.findOne({ _id: id, activo: { $ne: false } }).select('_id rol'),
      LearnerProfile.findOne({ _id: id, activo: { $ne: false } }).select('_id rol'),
    ]);
    const existing = instructor || learner;
    if (!existing) throw httpError(404, 'Usuario no encontrado.');
    if (
      existing.rol === 'instructor' &&
      (
        await Ficha.exists({ activa: true, instructor: existing._id }) ||
        await Schedule.exists({ activa: true, instructor: existing._id })
      )
    ) {
      throw httpError(
        409,
        'Reasigna o desactiva primero las fichas activas de este instructor.'
      );
    }

    const user = await getProfileModel(existing.rol).findOneAndUpdate(
      { _id: id, activo: { $ne: false } },
      { $set: { activo: false } },
      { new: true }
    ).select('_id nombre rol activo');
    if (!user) throw httpError(404, 'Usuario no encontrado.');

    if (user.rol === 'aprendiz') {
      await Enrollment.updateMany(
        { aprendizId: user._id, estado: 'activa' },
        { $set: { estado: 'retirada' } }
      );
      await this.syncLearnerFichas(user._id);
    }
    return sanitizeUserProfile(user);
  }

  async listFichas() {
    const fichas = await Ficha.find({ activa: true })
      .populate({ path: 'instructor', select: '-password -authVersion' })
      .sort({ codigo: 1 })
      .lean();
    return populateProfileAccounts(fichas);
  }

  async createFicha(data) {
    const payload = pick(data, FICHA_FIELDS);
    validateFichaSchedule(payload);
    await this.validateFichaReferences(payload);
    const period = await findOrCreatePeriod(payload.periodo, payload.fechaInicio, payload.fechaFin);
    const ficha = await Ficha.create({
      codigo: payload.codigo,
      programa: payload.programa,
      periodoId: period._id,
      fechaInicio: payload.fechaInicio,
      fechaFin: payload.fechaFin,
      instructor: payload.instructor,
    });
    try {
      await this.replaceFichaSchedules(ficha._id, makeSchedules(payload, payload.instructor));
      await this.replaceFichaEnrollments(ficha._id, payload.aprendices || []);
      await this.syncInstructorFicha(ficha);
    } catch (error) {
      await Promise.all([
        Schedule.deleteMany({ fichaId: ficha._id }),
        Enrollment.deleteMany({ fichaId: ficha._id }),
        Ficha.deleteOne({ _id: ficha._id }),
      ]);
      throw error;
    }
    return (await this.getFichaView(ficha._id));
  }

  async updateFicha(id, data) {
    const previousFicha = await Ficha.findOne({ _id: id, activa: true })
      .populate({ path: 'instructor', select: '-password -authVersion' })
      .lean();
    if (!previousFicha) throw httpError(404, 'Ficha no encontrada.');
    const previousView = (await populateProfileAccounts([previousFicha]))[0];
    const payload = pick(data, FICHA_FIELDS);
    if (Object.keys(payload).length === 0) {
      throw httpError(400, 'No hay campos válidos para actualizar.');
    }
    validateFichaSchedule(payload, previousView);
    await this.validateFichaReferences(payload, previousView);
    const periodName = payload.periodo || previousView.periodo;
    const period = await findOrCreatePeriod(
      periodName,
      payload.fechaInicio || previousView.fechaInicio,
      payload.fechaFin || previousView.fechaFin
    );
    const fichaUpdate = pick(payload, ['codigo', 'programa', 'fechaInicio', 'fechaFin', 'instructor']);
    fichaUpdate.periodoId = period._id;
    const ficha = await Ficha.findOneAndUpdate(
      { _id: id, activa: true },
      { $set: fichaUpdate },
      { new: true, runValidators: true }
    );
    if (!ficha) throw httpError(404, 'Ficha no encontrada.');
    if (Object.prototype.hasOwnProperty.call(payload, 'sesiones') ||
      Object.prototype.hasOwnProperty.call(payload, 'dias') ||
      Object.prototype.hasOwnProperty.call(payload, 'horaInicio') ||
      Object.prototype.hasOwnProperty.call(payload, 'horaFin') ||
      Object.prototype.hasOwnProperty.call(payload, 'ambiente')) {
      if (Object.prototype.hasOwnProperty.call(payload, 'sesiones')) {
        await this.replaceFichaSchedules(
          id,
          makeSchedules(payload, payload.instructor || previousView.instructor._id)
        );
      } else {
        await this.replaceFichaSchedules(id, makeSchedules({
          ...previousView,
          ...payload,
          dias: payload.dias || previousView.dias,
          sesiones: [],
        }, payload.instructor || previousView.instructor._id));
      }
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'aprendices')) {
      await this.replaceFichaEnrollments(id, payload.aprendices);
    }
    await this.syncInstructorFicha(await Ficha.findById(id).lean(), previousView);
    return this.getFichaView(id);
  }

  async deactivateFicha(id) {
    const ficha = await Ficha.findOneAndUpdate(
      { _id: id, activa: true },
      { $set: { activa: false } },
      { new: true }
    );
    if (!ficha) throw httpError(404, 'Ficha no encontrada.');
    const enrolledLearners = await Enrollment.find({ fichaId: ficha._id, estado: 'activa' })
      .distinct('aprendizId');
    await Promise.all([
      Enrollment.updateMany({ fichaId: ficha._id, estado: 'activa' }, { $set: { estado: 'finalizada' } }),
      Schedule.updateMany({ fichaId: ficha._id, activa: true }, { $set: { activa: false } }),
    ]);
    await Promise.all(enrolledLearners.map((learnerId) => this.syncLearnerFichas(learnerId)));
    await InstructorProfile.updateMany(
      {},
      { $pull: { fichasAsignadas: ficha.codigo } }
    );
    return ficha;
  }

  async addNovedad(fichaId, actor, data) {
    const ficha = await Ficha.findOne({ _id: fichaId, activa: true });
    if (!ficha) throw httpError(404, 'Ficha no encontrada.');
    const instructorHasSchedule = await Schedule.exists({
      fichaId,
      instructor: actor._id,
      activa: true,
    });
    if (
      actor.rol !== 'coordinador' &&
      String(ficha.instructor) !== String(actor._id) &&
      !instructorHasSchedule
    ) {
      throw httpError(403, 'Solo coordinación o el instructor asignado puede reportar novedades.');
    }
    if (!data.tipo || !data.mensaje || !data.fechaClase) {
      throw httpError(400, 'Tipo, mensaje y fecha de clase son obligatorios.');
    }
    return Announcement.create({
      fichaId: ficha._id,
      tipo: data.tipo,
      mensaje: data.mensaje,
      fechaClase: data.fechaClase,
      creadaPor: actor._id,
      rolCreador: actor.rol,
    });
  }

  async getLearnerSchedule(learnerId) {
    const enrollments = await Enrollment.find({ aprendizId: learnerId, estado: 'activa' }).select('fichaId');
    const fichas = await Ficha.find({
      _id: { $in: enrollments.map((enrollment) => enrollment.fichaId) },
      activa: true,
    }).populate({ path: 'instructor', select: '-password -authVersion' }).sort({ codigo: 1 }).lean();
    const populatedFichas = await populateProfileAccounts(fichas);
    const participations = await EvaluationParticipation.find({
      learnerId,
      fichaId: { $in: fichas.map((ficha) => ficha._id) },
    }).select('fichaId periodo instructorId');
    const submitted = new Set(participations.map((participation) =>
      `${participation.fichaId}:${participation.periodo}:${participation.instructorId}`
    ));
    return populatedFichas.map((ficha) => ({
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
    }));
  }

  async getInstructorFichas(instructorId) {
    const schedules = await Schedule.find({ instructor: instructorId, activa: true }).select('fichaId');
    const fichas = await Ficha.find({
      $or: [{ instructor: instructorId }, { _id: { $in: schedules.map((schedule) => schedule.fichaId) } }],
      activa: true,
    }).populate({ path: 'instructor', select: '-password -authVersion' }).sort({ codigo: 1 }).lean();
    if (fichas.length === 0) return [];
    const fichaViews = await populateProfileAccounts(fichas);
    const participationCounts = await EvaluationParticipation.aggregate([
      {
        $match: {
          fichaId: { $in: fichas.map((ficha) => ficha._id) },
          periodo: { $in: [...new Set(fichaViews.map((ficha) => ficha.periodo))] },
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

    return fichaViews.map((ficha) => ({
      ...ficha,
      sesiones: ficha.sesiones.filter(
        (session) => String(session.instructor?._id || session.instructor) === String(instructorId)
      ),
      totalAprendices: ficha.aprendices.length,
      totalEvaluaciones:
        totalsByFichaAndPeriod.get(`${ficha._id}:${ficha.periodo}:${instructorId}`) || 0,
    }));
  }

  async validateFichaReferences(payload, existingFicha = null) {
    if (
      (!existingFicha && (typeof payload.periodo !== 'string' || !payload.periodo.trim())) ||
      (payload.periodo !== undefined &&
        (typeof payload.periodo !== 'string' || !payload.periodo.trim()))
    ) {
      throw httpError(400, 'El periodo de formación es obligatorio.');
    }
    if (!payload.instructor && !existingFicha?.instructor) {
      throw httpError(400, 'El instructor principal de la ficha es obligatorio.');
    }
    if (payload.instructor) {
      const instructor = await InstructorProfile.findById(payload.instructor)
        .select('_id activo');
      if (!instructor || instructor.activo === false) {
        throw httpError(400, 'El instructor asignado no existe o está inactivo.');
      }
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
      const instructorIds = [...new Set(payload.sesiones.map((session) =>
        String(session.instructor?._id || session.instructor)
      ))];
      if (instructorIds.some((id) => !id || id === 'undefined' || id === 'null')) {
        throw httpError(400, 'Cada bloque debe tener un instructor asignado.');
      }
      const instructors = await InstructorProfile.find({ _id: { $in: instructorIds } })
        .select('_id activo');
      if (instructors.filter((instructor) => instructor.activo !== false).length !== instructorIds.length) {
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
        String(session.instructor?._id || session.instructor) ===
        String(primaryInstructor?._id || primaryInstructor)
      )
    ) {
      throw httpError(400, 'El instructor principal de la ficha debe estar asignado a uno de sus bloques.');
    }
    if (payload.aprendices) {
      if (!Array.isArray(payload.aprendices)) {
        throw httpError(400, 'La lista de aprendices no es válida.');
      }
      const learners = await LearnerProfile.find({
        _id: { $in: payload.aprendices },
      }).select('_id activo');
      if (
        learners.filter((learner) => learner.activo !== false).length !==
        new Set(payload.aprendices.map(String)).size
      ) {
        throw httpError(400, 'Todos los aprendices asignados deben existir y estar activos.');
      }
    }
  }

  async getFichaView(id) {
    const ficha = await Ficha.findById(id)
      .populate({ path: 'instructor', select: '-password -authVersion' })
      .lean();
    if (!ficha) return null;
    return (await populateProfileAccounts([ficha]))[0];
  }

  async replaceFichaSchedules(fichaId, sessions) {
    await this.validateFichaReferences({ sesiones: sessions }, await this.getFichaView(fichaId));
    await Schedule.updateMany(
      { fichaId, activa: true },
      { $set: { activa: false } }
    );
    if (sessions.length) {
      await Schedule.insertMany(sessions.map((session) => ({
        fichaId,
        instructor: session.instructor?._id || session.instructor,
        dia: session.dia,
        horaInicio: session.horaInicio,
        horaFin: session.horaFin,
        tema: session.tema || '',
        ambiente: session.ambiente || '',
      })));
    }
  }

  async replaceFichaEnrollments(fichaId, learnerIds) {
    if (!Array.isArray(learnerIds)) throw httpError(400, 'La lista de aprendices no es válida.');
    const existingEnrollments = await Enrollment.find({ fichaId, estado: 'activa' })
      .select('aprendizId')
      .lean();
    const affectedLearners = new Set(existingEnrollments.map((row) => String(row.aprendizId)));
    await Enrollment.updateMany(
      { fichaId, estado: 'activa' },
      { $set: { estado: 'retirada' } }
    );
    for (const aprendizId of new Set(learnerIds.map(String))) {
      affectedLearners.add(aprendizId);
      await Enrollment.findOneAndUpdate(
        { fichaId, aprendizId },
        { $set: { estado: 'activa' }, $setOnInsert: { fichaId, aprendizId } },
        { upsert: true, new: true, runValidators: true }
      );
    }
    await Promise.all([...affectedLearners].map((learnerId) =>
      this.syncLearnerFichas(learnerId)
    ));
  }

  async syncLearnerFichas(learnerId) {
    const enrollments = await Enrollment.find({
      aprendizId: learnerId,
      estado: 'activa',
    }).select('fichaId').lean();
    await LearnerProfile.updateOne(
      { _id: learnerId },
      { $set: { fichas: enrollments.map((enrollment) => enrollment.fichaId) } }
    );
  }

  async syncInstructorFicha(ficha, previousFicha = null) {
    if (previousFicha) {
      await InstructorProfile.updateMany(
        { fichasAsignadas: previousFicha.codigo },
        { $pull: { fichasAsignadas: previousFicha.codigo } }
      );
    }
    const schedules = ficha._id
      ? await Schedule.find({ fichaId: ficha._id, activa: true }).select('instructor').lean()
      : [];
    const instructorIds = [...new Set([
      String(ficha.instructor),
      ...schedules.map((session) => String(session.instructor)),
    ])];
    await InstructorProfile.updateMany(
      { _id: { $nin: instructorIds }, fichasAsignadas: ficha.codigo },
      { $pull: { fichasAsignadas: ficha.codigo } }
    );
    await InstructorProfile.updateMany(
      { _id: { $in: instructorIds } },
      { $addToSet: { fichasAsignadas: ficha.codigo } }
    );
  }
}

module.exports = new ManagementService();
