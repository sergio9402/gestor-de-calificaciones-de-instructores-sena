const crypto = require('node:crypto');
const Ficha = require('../models/Ficha');
const User = require('../models/User');
const managementService = require('./managementService');

const DAYS = new Set(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
const httpError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

function isTestImportEnabled() {
  return process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_TEST_DATA_IMPORT === 'true';
}

function validateInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { errors: ['El archivo debe contener un objeto JSON.'] };
  }
  const instructors = Array.isArray(input.instructors) ? input.instructors : [];
  const learners = Array.isArray(input.learners) ? input.learners : [];
  const ficha = input.ficha;
  if (!Array.isArray(input.instructors) || instructors.length === 0) {
    errors.push('Agrega al menos un instructor.');
  }
  if (!Array.isArray(input.learners) || learners.length === 0) {
    errors.push('Agrega al menos un aprendiz.');
  }
  if (instructors.length > 100 || learners.length > 500) {
    errors.push('La importación supera el límite de 100 instructores o 500 aprendices.');
  }
  if (!ficha || typeof ficha !== 'object' || Array.isArray(ficha)) {
    errors.push('Faltan los datos de la ficha.');
  }

  const allUsers = [...instructors, ...learners];
  const emails = allUsers.map((user) => String(user?.email || '').trim().toLowerCase());
  if (emails.some((email) => !/^[^\s@]+@[^\s@]+\.test$/.test(email))) {
    errors.push('Todos los correos de prueba deben usar el dominio reservado example.test.');
  }
  if (new Set(emails).size !== emails.length) {
    errors.push('Hay correos repetidos en el archivo.');
  }
  if (allUsers.some((user) =>
    !user || typeof user.nombre !== 'string' || user.nombre.trim().length < 2 ||
    user.nombre.trim().length > 100
  )) {
    errors.push('Cada usuario debe tener un nombre válido (2 a 100 caracteres).');
  }
  if (learners.some((learner) =>
    !learner ||
    !['CC', 'TI'].includes(learner.tipoDocumento) ||
    !/^\d{6,15}$/.test(String(learner.documento || ''))
  )) {
    errors.push('Cada aprendiz debe tener tipo y número de documento válidos.');
  }
  const documents = learners.map((learner) =>
    `${learner.tipoDocumento}:${learner.documento}`
  );
  if (new Set(documents).size !== documents.length) {
    errors.push('Hay números de documento repetidos en el listado.');
  }
  if (typeof input.coordinatorName !== 'string' ||
    input.coordinatorName.trim().length < 2 ||
    input.coordinatorName.trim().length > 100
  ) {
    errors.push('El nombre de coordinación debe tener entre 2 y 100 caracteres.');
  }
  if (!ficha || typeof ficha.codigo !== 'string' || !ficha.codigo.trim() ||
    typeof ficha.programa !== 'string' || !ficha.programa.trim() ||
    typeof ficha.periodo !== 'string' || !ficha.periodo.trim()
  ) {
    errors.push('Código, programa y periodo son obligatorios.');
  }
  if (!ficha || !/^\d{4}-\d{2}-\d{2}$/.test(ficha.fechaInicio || '') ||
    !/^\d{4}-\d{2}-\d{2}$/.test(ficha.fechaFin || '') ||
    Number.isNaN(Date.parse(`${ficha.fechaInicio}T00:00:00Z`)) ||
    Number.isNaN(Date.parse(`${ficha.fechaFin}T00:00:00Z`)) ||
    ficha.fechaInicio > ficha.fechaFin
  ) {
    errors.push('El rango de fechas de la ficha no es válido.');
  }
  if (!ficha || !Array.isArray(ficha.sesiones) || ficha.sesiones.length === 0) {
    errors.push('La ficha debe tener al menos un bloque horario.');
  }
  if (ficha?.sesiones?.length > 100) {
    errors.push('La ficha supera el límite de 100 bloques horarios.');
  }
  const instructorsByEmail = new Set(instructors.map((user) =>
    String(user?.email || '').trim().toLowerCase()
  ));
  const sessionsByDay = new Map();
  const sessions = Array.isArray(ficha?.sesiones) ? ficha.sesiones : [];
  for (const [index, session] of sessions.entries()) {
    if (
      !session || !DAYS.has(session.dia) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(session.horaInicio || '') ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(session.horaFin || '') ||
      session.horaInicio >= session.horaFin ||
      !instructorsByEmail.has(String(session.instructorEmail || '').trim().toLowerCase())
    ) {
      errors.push(`El bloque ${index + 1} tiene datos inválidos o un instructor sin registrar.`);
      continue;
    }
    if (typeof session.tema !== 'string' || session.tema.length > 500 ||
      typeof session.ambiente !== 'string' || session.ambiente.length > 120
    ) {
      errors.push(`El tema o ambiente del bloque ${index + 1} excede el límite permitido.`);
    }
    const sameDay = sessionsByDay.get(session.dia) || [];
    if (sameDay.some((other) =>
      session.horaInicio < other.horaFin && session.horaFin > other.horaInicio
    )) {
      errors.push(`El bloque ${index + 1} se superpone con otro horario del mismo día.`);
    }
    sameDay.push(session);
    sessionsByDay.set(session.dia, sameDay);
  }
  return { errors, instructors, learners, ficha };
}

class TestImportService {
  async preview(input) {
    if (!isTestImportEnabled()) {
      throw httpError(403, 'La importación de datos de prueba no está habilitada en este entorno.');
    }
    const validation = validateInput(input);
    if (validation.errors.length) {
      return { valid: false, errors: validation.errors };
    }
    const emails = [...validation.instructors, ...validation.learners]
      .map((user) => String(user.email).trim().toLowerCase());
    const [existingUsers, existingFicha] = await Promise.all([
      User.find({ email: { $in: emails } }).select('email').lean(),
      Ficha.exists({ codigo: validation.ficha.codigo.trim() }),
    ]);
    const errors = [];
    if (existingUsers.length) {
      errors.push(`Ya existen cuentas con estos correos: ${existingUsers.map((user) => user.email).join(', ')}.`);
    }
    if (existingFicha) errors.push(`La ficha ${validation.ficha.codigo} ya existe.`);
    const existingDocuments = await User.find({
      $or: validation.learners.map((learner) => ({
        tipoDocumento: learner.tipoDocumento,
        documento: String(learner.documento),
      })),
    }).select('tipoDocumento documento').lean();
    if (existingDocuments.length) {
      errors.push('Uno o más documentos ya están registrados en otra cuenta.');
    }
    return {
      valid: errors.length === 0,
      errors,
      summary: {
        coordinatorName: input.coordinatorName.trim(),
        instructors: validation.instructors.length,
        learners: validation.learners.length,
        sessions: validation.ficha.sesiones.length,
        fichaCode: validation.ficha.codigo.trim(),
        period: validation.ficha.periodo.trim(),
        dateRange: [validation.ficha.fechaInicio, validation.ficha.fechaFin],
      },
    };
  }

  async confirm(input, coordinatorId) {
    const preview = await this.preview(input);
    if (!preview.valid) {
      throw httpError(400, preview.errors.join(' '));
    }
    const instructorByEmail = new Map();
    const createdUserIds = [];
    let createdFichaId;
    try {
      for (const instructor of input.instructors) {
        const password = crypto.randomBytes(18).toString('base64url');
        const user = await User.create({
          nombre: instructor.nombre.trim(),
          email: instructor.email.trim().toLowerCase(),
          password,
          rol: 'instructor',
          especialidad: instructor.especialidad || 'Formación profesional integral',
          centro: instructor.centro || 'Centro de Formación SENA',
          activo: true,
        });
        createdUserIds.push(user._id);
        instructorByEmail.set(user.email, { user, password });
      }

      const learnerByEmail = new Map();
      for (const learner of input.learners) {
        const password = crypto.randomBytes(18).toString('base64url');
        const user = await User.create({
          nombre: learner.nombre.trim(),
          email: learner.email.trim().toLowerCase(),
          password,
          rol: 'aprendiz',
          tipoDocumento: learner.tipoDocumento,
          documento: String(learner.documento),
          activo: true,
        });
        createdUserIds.push(user._id);
        learnerByEmail.set(user.email, { user, password });
      }

      const sessions = input.ficha.sesiones.map((session) => ({
        dia: session.dia,
        horaInicio: session.horaInicio,
        horaFin: session.horaFin,
        instructor: instructorByEmail.get(session.instructorEmail.trim().toLowerCase()).user._id,
        tema: session.tema,
        ambiente: session.ambiente,
      }));
      const primaryInstructor = instructorByEmail.get(
        input.ficha.sesiones[0].instructorEmail.trim().toLowerCase()
      ).user;
      const ficha = await Ficha.create({
        codigo: input.ficha.codigo.trim(),
        programa: input.ficha.programa.trim(),
        periodo: input.ficha.periodo.trim(),
        fechaInicio: new Date(`${input.ficha.fechaInicio}T00:00:00.000Z`),
        fechaFin: new Date(`${input.ficha.fechaFin}T00:00:00.000Z`),
        instructor: primaryInstructor._id,
        ambiente: sessions[0].ambiente,
        dias: [...new Set(sessions.map((session) => session.dia))],
        horaInicio: sessions.map((session) => session.horaInicio).sort()[0],
        horaFin: sessions.map((session) => session.horaFin).sort().at(-1),
        sesiones: sessions,
        aprendices: [...learnerByEmail.values()].map(({ user }) => user._id),
      });
      createdFichaId = ficha._id;
      await managementService.syncInstructorFicha(ficha);
      const coordinator = await User.findOneAndUpdate(
        { _id: coordinatorId, rol: 'coordinador' },
        { $set: { nombre: input.coordinatorName.trim() } },
        { new: true, runValidators: true }
      ).select('-password');
      if (!coordinator) throw httpError(404, 'No se encontró la cuenta de coordinación activa.');
      return {
        ficha,
        coordinator,
        credentials: [
          ...[...instructorByEmail.values()].map(({ user, password }) => ({
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            password,
          })),
          ...[...learnerByEmail.values()].map(({ user, password }) => ({
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            password,
          })),
        ],
      };
    } catch (error) {
      try {
        if (createdFichaId) await Ficha.deleteOne({ _id: createdFichaId });
        if (createdUserIds.length) {
          await User.deleteMany({ _id: { $in: createdUserIds } });
        }
      } catch (rollbackError) {
        const rollbackFailure = httpError(
          500,
          'Falló la importación y no se pudieron revertir todos los registros; revisa la base de pruebas.'
        );
        rollbackFailure.cause = rollbackError;
        throw rollbackFailure;
      }
      throw error;
    }
  }
}

module.exports = new TestImportService();
