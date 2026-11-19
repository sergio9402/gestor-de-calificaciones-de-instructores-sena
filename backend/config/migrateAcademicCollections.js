require('dotenv').config();
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const CoordinatorProfile = require('../models/CoordinatorProfile');
const Enrollment = require('../models/Enrollment');
const Evaluation = require('../models/Evaluation');
const EvaluationParticipation = require('../models/EvaluationParticipation');
const Ficha = require('../models/Ficha');
const InstructorProfile = require('../models/InstructorProfile');
const LearnerProfile = require('../models/LearnerProfile');
const Period = require('../models/Period');
const Schedule = require('../models/Schedule');

function assertMigrationEnabled() {
  if (
    process.argv[2] !== '--run' ||
    process.env.ALLOW_ACADEMIC_COLLECTIONS_MIGRATION !== 'true' ||
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error(
      'Migración bloqueada. Requiere --run, ALLOW_ACADEMIC_COLLECTIONS_MIGRATION=true y un entorno no productivo.'
    );
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI no está configurada.');
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

async function migrateAcademicCollections() {
  assertMigrationEnabled();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  const legacyFichas = await Ficha.collection.find({}).toArray();
  let periodsCreated = 0;
  let enrollmentsCreated = 0;
  let schedulesCreated = 0;
  let announcementsCreated = 0;

  for (const ficha of legacyFichas) {
    if (ficha.instructor && !(await InstructorProfile.exists({ _id: ficha.instructor }))) {
      throw new Error(`No existe el perfil del instructor principal de la ficha ${ficha.codigo}.`);
    }
    let periodId = ficha.periodoId;
    if (!periodId) {
      const periodName = ficha.periodo || 'Sin periodo';
      const existed = await Period.exists({ nombre: periodName });
      const period = await findOrCreatePeriod(periodName, ficha.fechaInicio, ficha.fechaFin);
      periodId = period._id;
      if (!existed) periodsCreated += 1;
      await Ficha.collection.updateOne(
        { _id: ficha._id },
        { $set: { periodoId: periodId } }
      );
    } else if (!(await Period.exists({ _id: periodId }))) {
      throw new Error(`El periodo de la ficha ${ficha.codigo} no existe.`);
    }

    for (const learnerId of ficha.aprendices || []) {
      if (!(await LearnerProfile.exists({ _id: learnerId }))) {
        throw new Error(`No existe el perfil del aprendiz ${learnerId} de la ficha ${ficha.codigo}.`);
      }
      const result = await Enrollment.updateOne(
        { aprendizId: learnerId, fichaId: ficha._id },
        { $set: { estado: 'activa' }, $setOnInsert: { aprendizId: learnerId, fichaId: ficha._id } },
        { upsert: true }
      );
      if (result.upsertedCount) enrollmentsCreated += 1;
    }

    const legacySchedules = (ficha.sesiones || []).length
      ? ficha.sesiones
      : (ficha.dias || []).map((dia) => ({
        dia,
        instructor: ficha.instructor,
        horaInicio: ficha.horaInicio,
        horaFin: ficha.horaFin,
        ambiente: ficha.ambiente || '',
        tema: '',
      }));
    for (const [index, schedule] of legacySchedules.entries()) {
      const instructorId = schedule.instructor || ficha.instructor;
      if (!instructorId) {
        throw new Error(`El horario ${index + 1} de la ficha ${ficha.codigo} no tiene instructor.`);
      }
      if (!(await InstructorProfile.exists({ _id: instructorId }))) {
        throw new Error(`No existe el instructor del horario ${index + 1} de la ficha ${ficha.codigo}.`);
      }
      const exists = await Schedule.exists({
        fichaId: ficha._id,
        dia: schedule.dia,
        horaInicio: schedule.horaInicio,
        horaFin: schedule.horaFin,
        instructor: instructorId,
        activa: true,
      });
      if (exists) continue;
      await Schedule.create({
        fichaId: ficha._id,
        instructor: instructorId,
        dia: schedule.dia,
        horaInicio: schedule.horaInicio,
        horaFin: schedule.horaFin,
        tema: schedule.tema || '',
        ambiente: schedule.ambiente || ficha.ambiente || '',
      });
      schedulesCreated += 1;
    }

    for (const legacyAnnouncement of ficha.novedades || []) {
      const announcementId = legacyAnnouncement._id;
      if (!announcementId) {
        throw new Error(`Una novedad de la ficha ${ficha.codigo} no tiene identificador.`);
      }
      if (!legacyAnnouncement.creadaPor) {
        throw new Error(`Una novedad de la ficha ${ficha.codigo} no tiene autor.`);
      }
      const authorRole = (await CoordinatorProfile.exists({ _id: legacyAnnouncement.creadaPor }))
        ? 'coordinador'
        : (await InstructorProfile.exists({ _id: legacyAnnouncement.creadaPor }))
          ? 'instructor'
          : null;
      if (!authorRole) {
        throw new Error(`No existe la cuenta autora de una novedad de la ficha ${ficha.codigo}.`);
      }
      const existingAnnouncement = await Announcement.findById(announcementId).lean();
      if (existingAnnouncement) {
        if (String(existingAnnouncement.fichaId) !== String(ficha._id)) {
          throw new Error(`El identificador de una novedad de la ficha ${ficha.codigo} ya está en uso.`);
        }
        if (!existingAnnouncement.rolCreador) {
          await Announcement.collection.updateOne(
            { _id: announcementId },
            { $set: { rolCreador: authorRole } }
          );
        }
        continue;
      }
      await Announcement.create({
        _id: announcementId,
        fichaId: ficha._id,
        creadaPor: legacyAnnouncement.creadaPor,
        rolCreador: authorRole,
        tipo: legacyAnnouncement.tipo,
        mensaje: legacyAnnouncement.mensaje,
        fechaClase: legacyAnnouncement.fechaClase,
        createdAt: legacyAnnouncement.createdAt,
        updatedAt: legacyAnnouncement.updatedAt,
      });
      announcementsCreated += 1;
    }
  }

  const periodIdsByName = new Map(
    (await Period.find({}).select('_id nombre').lean()).map((period) => [period.nombre, period._id])
  );
  for (const evaluation of await Evaluation.collection.find({
    $or: [{ periodoId: { $exists: false } }, { periodoId: null }],
    periodo: { $type: 'string' },
  }).toArray()) {
    const ficha = evaluation.fichaId
      ? await Ficha.collection.findOne({ _id: evaluation.fichaId }, { projection: { periodoId: 1 } })
      : null;
    const periodId = ficha?.periodoId || periodIdsByName.get(evaluation.periodo);
    if (periodId) {
      await Evaluation.collection.updateOne(
        { _id: evaluation._id },
        { $set: { periodoId: periodId } }
      );
    }
  }

  for (const participation of await EvaluationParticipation.collection.find({
    $or: [{ periodoId: { $exists: false } }, { periodoId: null }],
  }).toArray()) {
    const ficha = await Ficha.collection.findOne(
      { _id: participation.fichaId },
      { projection: { periodoId: 1, periodo: 1 } }
    );
    const periodId = ficha?.periodoId || periodIdsByName.get(participation.periodo);
    if (periodId) {
      await EvaluationParticipation.collection.updateOne(
        { _id: participation._id },
        { $set: { periodoId: periodId } }
      );
    }
  }

  const evaluationsWithoutPeriod = await Evaluation.countDocuments({
    $or: [{ periodoId: { $exists: false } }, { periodoId: null }],
  });
  const fichasWithoutPeriod = await Ficha.countDocuments({ periodoId: { $exists: false } });
  const fichaIds = await Ficha.distinct('_id');
  const periodIds = await Period.distinct('_id');
  const instructorIds = await InstructorProfile.distinct('_id');
  const learnerIds = await LearnerProfile.distinct('_id');
  const [coordinatorIds, instructorAuthorIds] = await Promise.all([
    CoordinatorProfile.distinct('_id'),
    InstructorProfile.distinct('_id'),
  ]);
  const authorIds = [...coordinatorIds, ...instructorAuthorIds];
  const invalidEnrollments = await Enrollment.countDocuments({
    $or: [
      { aprendizId: { $exists: false } },
      { fichaId: { $exists: false } },
      { aprendizId: { $nin: learnerIds } },
      { fichaId: { $nin: fichaIds } },
    ],
  });
  const invalidSchedules = await Schedule.countDocuments({
    $or: [
      { instructor: { $exists: false } },
      { fichaId: { $exists: false } },
      { instructor: { $nin: instructorIds } },
      { fichaId: { $nin: fichaIds } },
    ],
  });
  const invalidAnnouncements = await Announcement.countDocuments({
    $or: [
      { creadaPor: { $exists: false } },
      { fichaId: { $exists: false } },
      { creadaPor: { $nin: authorIds } },
      { rolCreador: { $nin: ['coordinador', 'instructor'] } },
      { fichaId: { $nin: fichaIds } },
    ],
  });
  const fichasWithInvalidPeriod = await Ficha.countDocuments({ periodoId: { $nin: periodIds } });
  if (
    fichasWithoutPeriod ||
    fichasWithInvalidPeriod ||
    invalidEnrollments ||
    invalidSchedules ||
    invalidAnnouncements
  ) {
    throw new Error('La verificación encontró referencias incompletas; se conservan los datos originales.');
  }

  await Ficha.collection.updateMany(
    {},
    { $unset: {
      periodo: '',
      aprendices: '',
      sesiones: '',
      novedades: '',
      dias: '',
      horaInicio: '',
      horaFin: '',
      ambiente: '',
    } }
  );
  const [fichaCount, enrollmentCount, scheduleCount, announcementCount] = await Promise.all([
    Ficha.countDocuments({}),
    Enrollment.countDocuments({}),
    Schedule.countDocuments({}),
    Announcement.countDocuments({}),
  ]);
  console.log(
    `Migración académica terminada. Fichas: ${fichaCount}; periodos creados: ${periodsCreated}; inscripciones creadas: ${enrollmentsCreated}/${enrollmentCount}; horarios creados: ${schedulesCreated}/${scheduleCount}; novedades creadas: ${announcementsCreated}/${announcementCount}; evaluaciones históricas sin periodo: ${evaluationsWithoutPeriod}.`
  );
}

if (require.main === module) {
  migrateAcademicCollections()
    .catch((error) => {
      console.error('[Academic collections migration error]', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    });
}

module.exports = migrateAcademicCollections;
