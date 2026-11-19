const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const test = require('node:test');
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
const migrateAcademicCollections = require('../config/migrateAcademicCollections');

test('academic migration normalizes embedded records and is idempotent', async (t) => {
  const previous = {
    allow: process.env.ALLOW_ACADEMIC_COLLECTIONS_MIGRATION,
    mongoUri: process.env.MONGO_URI,
    nodeEnv: process.env.NODE_ENV,
    runArgument: process.argv[2],
  };
  const mongo = await MongoMemoryServer.create();
  process.env.ALLOW_ACADEMIC_COLLECTIONS_MIGRATION = 'true';
  process.env.MONGO_URI = mongo.getUri('academic-migration-test');
  process.env.NODE_ENV = 'test';
  process.argv[2] = '--run';

  t.after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
    if (previous.allow === undefined) delete process.env.ALLOW_ACADEMIC_COLLECTIONS_MIGRATION;
    else process.env.ALLOW_ACADEMIC_COLLECTIONS_MIGRATION = previous.allow;
    if (previous.mongoUri === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = previous.mongoUri;
    if (previous.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous.nodeEnv;
    if (previous.runArgument === undefined) delete process.argv[2];
    else process.argv[2] = previous.runArgument;
  });

  await mongoose.connect(process.env.MONGO_URI);
  const coordinator = await CoordinatorProfile.create({
    nombre: 'Coordinación de migración',
    email: 'coordinacion.academica@example.com',
    password: 'Academic-migration-2026',
    rol: 'coordinador',
  });
  const instructor = await InstructorProfile.create({
    nombre: 'Instructor de migración',
    email: 'instructor.academico@example.com',
    password: 'Academic-migration-2026',
    rol: 'instructor',
  });
  const learner = await LearnerProfile.create({
    nombre: 'Aprendiz de migración',
    email: 'aprendiz.academico@example.com',
    password: 'Academic-migration-2026',
    rol: 'aprendiz',
  });
  const fichaId = new mongoose.Types.ObjectId();
  const legacyNoticeId = new mongoose.Types.ObjectId();
  await Ficha.collection.insertOne({
    _id: fichaId,
    codigo: 'MIG-2026',
    programa: 'Programa de migración',
    periodo: '2026-2',
    instructor: instructor._id,
    fechaInicio: new Date('2026-07-01T00:00:00.000Z'),
    fechaFin: new Date('2026-12-01T00:00:00.000Z'),
    dias: ['Lunes'],
    horaInicio: '08:00',
    horaFin: '10:00',
    ambiente: 'Ambiente 1',
    sesiones: [{
      dia: 'Lunes',
      horaInicio: '08:00',
      horaFin: '10:00',
      instructor: instructor._id,
      tema: 'Modelado',
      ambiente: 'Ambiente 1',
    }],
    aprendices: [learner._id],
    novedades: [{
      _id: legacyNoticeId,
      tipo: 'general',
      mensaje: 'Aviso histórico de la ficha.',
      fechaClase: new Date('2026-08-03T00:00:00.000Z'),
      creadaPor: coordinator._id,
      createdAt: new Date('2026-07-20T00:00:00.000Z'),
      updatedAt: new Date('2026-07-20T00:00:00.000Z'),
    }],
    activa: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const evaluationId = new mongoose.Types.ObjectId();
  await Evaluation.collection.insertOne({
    _id: evaluationId,
    instructorId: instructor._id,
    fichaId,
    periodo: '2026-2',
    comentario: 'Evaluación histórica de prueba.',
    fecha: new Date(),
  });
  const participationId = new mongoose.Types.ObjectId();
  await EvaluationParticipation.collection.insertOne({
    _id: participationId,
    learnerId: learner._id,
    fichaId,
    instructorId: instructor._id,
    periodo: '2026-2',
  });

  await migrateAcademicCollections();

  const normalizedFicha = await Ficha.collection.findOne({ _id: fichaId });
  assert.ok(normalizedFicha.periodoId);
  for (const embeddedField of ['periodo', 'dias', 'horaInicio', 'horaFin', 'ambiente', 'sesiones', 'aprendices', 'novedades']) {
    assert.equal(Object.hasOwn(normalizedFicha, embeddedField), false);
  }
  assert.equal(await Period.countDocuments({ nombre: '2026-2' }), 1);
  assert.equal(await Enrollment.countDocuments({ fichaId, aprendizId: learner._id, estado: 'activa' }), 1);
  assert.equal(await Schedule.countDocuments({ fichaId, instructor: instructor._id }), 1);
  assert.ok(await Announcement.findById(legacyNoticeId));
  assert.equal(
    String((await Evaluation.collection.findOne({ _id: evaluationId })).periodoId),
    String(normalizedFicha.periodoId)
  );
  assert.equal(
    String((await EvaluationParticipation.collection.findOne({ _id: participationId })).periodoId),
    String(normalizedFicha.periodoId)
  );

  await migrateAcademicCollections();
  assert.equal(await Period.countDocuments({}), 1);
  assert.equal(await Enrollment.countDocuments({}), 1);
  assert.equal(await Schedule.countDocuments({}), 1);
  assert.equal(await Announcement.countDocuments({}), 1);
});
