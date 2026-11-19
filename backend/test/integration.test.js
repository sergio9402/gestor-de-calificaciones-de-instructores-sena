const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { once } = require('node:events');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const test = require('node:test');
const createApp = require('../app');
const emailService = require('../config/email');
const Evaluation = require('../models/Evaluation');
const EvaluationAnswer = require('../models/EvaluationAnswer');
const { questions } = require('../config/evaluationRubric');
const CoordinatorProfile = require('../models/CoordinatorProfile');
const InstructorProfile = require('../models/InstructorProfile');
const LearnerProfile = require('../models/LearnerProfile');
const PasswordResetToken = require('../models/PasswordResetToken');
const Ficha = require('../models/Ficha');
const Announcement = require('../models/Announcement');
const Enrollment = require('../models/Enrollment');
const Period = require('../models/Period');
const Schedule = require('../models/Schedule');
const { getInstructorReportData } = require('../services/instructorReportService');

const password = 'ClaveSegura-2026';
const jwtSecret = 'test-secret-with-more-than-thirty-two-characters';
const answersForEvaluation = () => questions.map((question) => ({
  codigo: question.code,
  calificacion: question.code === 'dominio_tecnico' ? 5 : 4,
  noAplica: false,
}));
let mongo;
let server;
let baseUrl;

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json();
  return { response, body };
}

async function login(email, role, loginPassword = password) {
  const { response, body } = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: loginPassword, rol: role }),
  });
  assert.equal(response.status, 200, body.message);
  assert.equal(Object.hasOwn(body.data, 'password'), false);
  return body.token;
}

test('role dashboards and anonymous evaluation flow work with isolated MongoDB', async (t) => {
  const previousJwtSecret = process.env.JWT_SECRET;
  const previousImportSetting = process.env.ENABLE_TEST_DATA_IMPORT;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousMailConfig = Object.fromEntries(
    ['FRONTEND_URL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
      .map((key) => [key, process.env[key]])
  );
  const originalSendPasswordResetEmail = emailService.sendPasswordResetEmail;
  process.env.JWT_SECRET = jwtSecret;
  process.env.ENABLE_TEST_DATA_IMPORT = 'true';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  process.env.SMTP_HOST = 'smtp.example.test';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_USER = 'test-user';
  process.env.SMTP_PASS = 'test-password';
  process.env.SMTP_FROM = 'test@example.test';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'sena-integration-test' });

  server = createApp().listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await mongoose.disconnect();
    await mongo.stop();
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
    if (previousImportSetting === undefined) delete process.env.ENABLE_TEST_DATA_IMPORT;
    else process.env.ENABLE_TEST_DATA_IMPORT = previousImportSetting;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    for (const [key, value] of Object.entries(previousMailConfig)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    emailService.sendPasswordResetEmail = originalSendPasswordResetEmail;
  });

  const coordinator = await CoordinatorProfile.create({
    nombre: 'Coordinación de Prueba',
    email: 'coordinacion@example.com',
    password,
    rol: 'coordinador',
  });
  const storedCoordinator = await CoordinatorProfile.collection.findOne({ _id: coordinator._id });
  assert.equal(storedCoordinator.rol, 'coordinador');
  assert.equal(storedCoordinator.activo, true);
  assert.equal(storedCoordinator.authVersion, 0);
  assert.match(storedCoordinator.password, /^scrypt\$/);
  assert.ok(storedCoordinator.createdAt instanceof Date);
  assert.ok(storedCoordinator.updatedAt instanceof Date);
  const coordinatorToken = await login('coordinacion@example.com', 'coordinador');

  const instructorResult = await request('/api/management/users', {
    token: coordinatorToken,
    method: 'POST',
    body: JSON.stringify({
      nombre: 'Instructor de Prueba',
      email: 'instructor@example.com',
      password,
      rol: 'instructor',
      especialidad: 'Desarrollo de software',
      centro: 'Centro de Prueba',
      tipoDocumento: 'CC',
      documento: '9988776655',
    }),
  });
  assert.equal(instructorResult.response.status, 201, instructorResult.body.message);
  const instructorId = instructorResult.body.data._id;
  assert.equal(Object.hasOwn(instructorResult.body.data, 'password'), false);
  const storedInstructor = await InstructorProfile.collection.findOne({
    _id: new mongoose.Types.ObjectId(instructorId),
  });
  assert.equal(storedInstructor.rol, 'instructor');
  assert.equal(storedInstructor.email, 'instructor@example.com');
  assert.match(storedInstructor.password, /^scrypt\$/);
  assert.equal(instructorResult.body.data.nombre, 'Instructor de Prueba');
  assert.equal(instructorResult.body.data.email, 'instructor@example.com');
  assert.equal(instructorResult.body.data.documento, '9988776655');

  const learners = [];
  for (let index = 1; index <= 5; index += 1) {
    const result = await request('/api/management/users', {
      token: coordinatorToken,
      method: 'POST',
      body: JSON.stringify({
        nombre: `Aprendiz ${index}`,
        email: `aprendiz${index}@example.com`,
        password,
        rol: 'aprendiz',
      }),
    });
    assert.equal(result.response.status, 201, result.body.message);
    assert.equal(Object.hasOwn(result.body.data, 'password'), false);
    learners.push(result.body.data);
  }

  const fichaResult = await request('/api/management/fichas', {
    token: coordinatorToken,
    method: 'POST',
    body: JSON.stringify({
      codigo: 'INT-1001',
      programa: 'Programa de Integración',
      periodo: '2026-2',
      instructor: instructorId,
      ambiente: 'Laboratorio 1',
      dias: ['Lunes', 'Miércoles'],
      horaInicio: '07:00',
      horaFin: '12:00',
      aprendices: learners.map((learner) => learner._id),
    }),
  });
  assert.equal(fichaResult.response.status, 201, fichaResult.body.message);
  const fichaId = fichaResult.body.data._id;
  assert.equal(await Period.countDocuments({ nombre: '2026-2' }), 1);
  assert.equal(await Enrollment.countDocuments({ fichaId, estado: 'activa' }), 5);
  assert.equal(await Schedule.countDocuments({ fichaId, activa: true }), 2);
  assert.ok((await LearnerProfile.findById(learners[0]._id).lean()).fichas.some(
    (learnerFichaId) => String(learnerFichaId) === String(fichaId)
  ));
  const storedFicha = await Ficha.collection.findOne({ _id: new mongoose.Types.ObjectId(fichaId) });
  assert.equal(Object.hasOwn(storedFicha, 'sesiones'), false);
  assert.equal(Object.hasOwn(storedFicha, 'aprendices'), false);

  const overlappingFichaUpdate = await request(`/api/management/fichas/${fichaId}`, {
    token: coordinatorToken,
    method: 'PATCH',
    body: JSON.stringify({
      sesiones: [
        {
          dia: 'Lunes',
          horaInicio: '08:00',
          horaFin: '10:00',
          instructor: instructorId,
        },
        {
          dia: 'Lunes',
          horaInicio: '09:00',
          horaFin: '11:00',
          instructor: instructorId,
        },
      ],
    }),
  });
  assert.equal(overlappingFichaUpdate.response.status, 400);

  const instructorToken = await login('instructor@example.com', 'instructor');
  const noticeResult = await request(`/api/management/fichas/${fichaId}/novedades`, {
    token: instructorToken,
    method: 'POST',
    body: JSON.stringify({
      tipo: 'general',
      mensaje: 'La próxima sesión iniciará con una actividad de repaso.',
      fechaClase: '2026-09-07',
    }),
  });
  assert.equal(noticeResult.response.status, 201, noticeResult.body.message);
  assert.equal(await Announcement.countDocuments({ fichaId }), 1);
  const instructorFichas = await request('/api/management/instructor/fichas', {
    token: instructorToken,
  });
  assert.equal(instructorFichas.response.status, 200);
  assert.equal(instructorFichas.body.data[0].totalAprendices, 5);
  assert.equal(instructorFichas.body.data[0].totalEvaluaciones, 0);

  const statusResult = await request(`/api/instructors/${instructorId}/status`, {
    token: instructorToken,
    method: 'PATCH',
    body: JSON.stringify({ estado: 'En Formación' }),
  });
  assert.equal(statusResult.response.status, 200, statusResult.body.message);

  const learnerTokens = [];
  for (let index = 1; index <= learners.length; index += 1) {
    learnerTokens.push(await login(`aprendiz${index}@example.com`, 'aprendiz'));
  }

  const firstSchedule = await request('/api/management/learner/schedule', {
    token: learnerTokens[0],
  });
  assert.equal(firstSchedule.response.status, 200);
  assert.equal(firstSchedule.body.data[0].yaEvaluo, false);
  assert.equal(firstSchedule.body.data[0].novedades.length, 1);
  const rubricResponse = await request('/api/evaluations/rubric', {
    token: learnerTokens[0],
  });
  assert.equal(rubricResponse.response.status, 200);
  assert.equal(rubricResponse.body.data.flatMap((category) => category.questions).length, 8);

  const incompleteEvaluation = await request('/api/evaluations', {
    token: learnerTokens[0],
    method: 'POST',
    body: JSON.stringify({
      instructorId,
      fichaId,
      respuestas: answersForEvaluation().slice(1),
      comentario: 'Evaluación incompleta de prueba.',
    }),
  });
  assert.equal(incompleteEvaluation.response.status, 400);

  const firstEvaluation = await request('/api/evaluations', {
    token: learnerTokens[0],
    method: 'POST',
    body: JSON.stringify({
      instructorId,
      fichaId,
      respuestas: answersForEvaluation(),
      comentario: 'Explica con claridad y resuelve las dudas del grupo.',
    }),
  });
  assert.equal(firstEvaluation.response.status, 201, firstEvaluation.body.message);

  const duplicateEvaluation = await request('/api/evaluations', {
    token: learnerTokens[0],
    method: 'POST',
    body: JSON.stringify({
      instructorId,
      fichaId,
      respuestas: answersForEvaluation(),
      comentario: 'Intento duplicado de evaluación.',
    }),
  });
  assert.equal(duplicateEvaluation.response.status, 409);

  const instructorProfileBeforeThreshold = await request(`/api/instructors/${instructorId}`, {
    token: instructorToken,
  });
  assert.equal(instructorProfileBeforeThreshold.response.status, 200);
  assert.deepEqual(instructorProfileBeforeThreshold.body.data.evaluacionesConsolidadas, []);

  for (let index = 1; index < learnerTokens.length; index += 1) {
    const result = await request('/api/evaluations', {
      token: learnerTokens[index],
      method: 'POST',
      body: JSON.stringify({
        instructorId,
        fichaId,
        respuestas: answersForEvaluation(),
        comentario: `Retroalimentación constructiva del aprendiz número ${index + 1}.`,
      }),
    });
    assert.equal(result.response.status, 201, result.body.message);
  }

  const savedEvaluation = await Evaluation.findOne({ instructorId }).lean();
  assert.equal(Object.hasOwn(savedEvaluation, 'learnerId'), false);
  assert.equal(
    await EvaluationAnswer.countDocuments({ evaluationId: savedEvaluation._id }),
    8
  );

  const learnerScheduleAfterThreshold = await request('/api/management/learner/schedule', {
    token: learnerTokens[0],
  });
  assert.equal(learnerScheduleAfterThreshold.body.data[0].yaEvaluo, true);

  const instructorProfileAfterThreshold = await request(`/api/instructors/${instructorId}`, {
    token: instructorToken,
  });
  const consolidated = instructorProfileAfterThreshold.body.data.evaluacionesConsolidadas;
  assert.equal(consolidated.length, 1);
  assert.equal(consolidated[0].totalEvaluaciones, 5);
  assert.equal(consolidated[0].comentarios.length, 5);
  assert.deepEqual(consolidated[0].promediosPorCategoria, {
    pedagogicas: 4.33,
    comunicativas: 4,
    compromiso: 4,
  });
  assert.equal(consolidated[0].promedioGeneral, 4.13);
  const reportData = await getInstructorReportData(instructorId);
  assert.equal(reportData.totalEvaluaciones, 5);
  assert.equal(reportData.promedioGeneral, 4.13);
  assert.deepEqual(reportData.promediosPorCategoria, {
    pedagogicas: 4.33,
    comunicativas: 4,
    compromiso: 4,
  });
  assert.equal(reportData.groups[0].comentarios.length, 5);
  assert.equal(Object.hasOwn(reportData.groups[0], 'learnerId'), false);

  const unauthenticatedReport = await request('/api/instructors/me/report.pdf');
  assert.equal(unauthenticatedReport.response.status, 401);
  const learnerReport = await request('/api/instructors/me/report.pdf', {
    token: learnerTokens[0],
  });
  assert.equal(learnerReport.response.status, 403);
  const reportResponse = await fetch(`${baseUrl}/api/instructors/me/report.pdf`, {
    headers: { Authorization: 'Bearer ' + instructorToken },
  });
  assert.equal(reportResponse.status, 200);
  assert.match(reportResponse.headers.get('content-type'), /application\/pdf/);
  assert.match(reportResponse.headers.get('content-disposition'), /attachment; filename="informe-retroalimentacion-/);
  const reportPdf = Buffer.from(await reportResponse.arrayBuffer());
  assert.equal(reportPdf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(reportPdf.length > 1000);

  const coordinatorMetrics = await request('/api/instructors/metrics/summary', {
    token: coordinatorToken,
  });
  assert.equal(coordinatorMetrics.response.status, 200);
  assert.equal(coordinatorMetrics.body.data.totalEvaluaciones, 5);
  assert.equal(coordinatorMetrics.body.data.promedioGlobal, 4.13);

  const coordinatorEvaluation = await request('/api/evaluations', {
    token: coordinatorToken,
    method: 'POST',
    body: JSON.stringify({
      instructorId,
      fichaId,
      respuestas: answersForEvaluation(),
      comentario: 'Coordinación no debe responder esta evaluación.',
    }),
  });
  assert.equal(coordinatorEvaluation.response.status, 403);

  const forbiddenLearnerList = await request('/api/management/users', {
    token: learnerTokens[0],
  });
  assert.equal(forbiddenLearnerList.response.status, 403);

  const importPayload = {
    coordinatorName: 'Coordinación Importada',
    instructors: [
      { nombre: 'Instructor Sintético Uno', email: 'instructor.uno@example.test' },
      { nombre: 'Instructor Sintético Dos', email: 'instructor.dos@example.test' },
    ],
    learners: [
      {
        nombre: 'Aprendiz Sintético',
        email: 'aprendiz.sintetico@example.test',
        tipoDocumento: 'CC',
        documento: '1234567890',
      },
    ],
    ficha: {
      codigo: 'TEST-IMPORT-1',
      programa: 'Prueba de importación',
      periodo: '2026-10-01 a 2026-12-01',
      fechaInicio: '2026-10-01',
      fechaFin: '2026-12-01',
      sesiones: [
        {
          dia: 'Lunes',
          horaInicio: '08:00',
          horaFin: '10:00',
          instructorEmail: 'instructor.uno@example.test',
          tema: 'Bloque de prueba uno',
          ambiente: 'Aula 1',
        },
        {
          dia: 'Martes',
          horaInicio: '10:00',
          horaFin: '12:00',
          instructorEmail: 'instructor.dos@example.test',
          tema: 'Bloque de prueba dos',
          ambiente: 'Aula 2',
        },
      ],
    },
  };
  const previewResult = await request('/api/management/test-imports/preview', {
    token: coordinatorToken,
    method: 'POST',
    body: JSON.stringify(importPayload),
  });
  assert.equal(previewResult.response.status, 200);
  assert.equal(previewResult.body.data.valid, true);
  assert.equal(previewResult.body.data.summary.learners, 1);
  assert.equal(previewResult.body.data.summary.sessions, 2);

  const overlapPayload = {
    ...importPayload,
    ficha: {
      ...importPayload.ficha,
      sesiones: [
        ...importPayload.ficha.sesiones,
        { ...importPayload.ficha.sesiones[0], horaInicio: '09:00', horaFin: '11:00' },
      ],
    },
  };
  const overlapPreview = await request('/api/management/test-imports/preview', {
    token: coordinatorToken,
    method: 'POST',
    body: JSON.stringify(overlapPayload),
  });
  assert.equal(overlapPreview.body.data.valid, false);

  const malformedPreview = await request('/api/management/test-imports/preview', {
    token: coordinatorToken,
    method: 'POST',
    body: JSON.stringify({
      ...importPayload,
      ficha: { ...importPayload.ficha, sesiones: 'no es una lista' },
    }),
  });
  assert.equal(malformedPreview.body.data.valid, false);

  const unsafePayload = {
    ...importPayload,
    learners: [{
      ...importPayload.learners[0],
      email: 'aprendiz@correo-real.com',
    }],
  };
  const unsafePreview = await request('/api/management/test-imports/preview', {
    token: coordinatorToken,
    method: 'POST',
    body: JSON.stringify(unsafePayload),
  });
  assert.equal(unsafePreview.body.data.valid, false);
  process.env.NODE_ENV = 'production';
  const productionPreview = await request('/api/management/test-imports/preview', {
    token: coordinatorToken,
    method: 'POST',
    body: JSON.stringify(importPayload),
  });
  assert.equal(productionPreview.response.status, 403);
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;

  const imported = await request('/api/management/test-imports/confirm', {
    token: coordinatorToken,
    method: 'POST',
    body: JSON.stringify(importPayload),
  });
  assert.equal(imported.response.status, 201, imported.body.message);
  assert.equal(imported.body.data.credentials.length, 3);
  assert.ok(imported.body.data.credentials.every((credential) => credential.password.length >= 12));
  assert.equal(imported.body.data.coordinator.nombre, 'Coordinación Importada');
  const coordinatorProfileAfterImport = await CoordinatorProfile.findById(coordinator._id).lean();
  assert.equal(coordinatorProfileAfterImport.nombre, 'Coordinación Importada');
  assert.equal(coordinatorProfileAfterImport.email, 'coordinacion@example.com');
  const importedInstructorTokens = await Promise.all(
    imported.body.data.credentials
      .filter((credential) => credential.rol === 'instructor')
      .map((credential) => login(credential.email, 'instructor', credential.password))
  );
  const importedLearner = imported.body.data.credentials.find(
    (credential) => credential.rol === 'aprendiz'
  );
  const importedLearnerToken = await login(importedLearner.email, 'aprendiz', importedLearner.password);
  const importedSchedule = await request('/api/management/learner/schedule', {
    token: importedLearnerToken,
  });
  const importedFicha = importedSchedule.body.data.find((ficha) => ficha.codigo === 'TEST-IMPORT-1');
  assert.equal(importedFicha.sesiones.length, 2);
  assert.equal(importedFicha.sesiones[0].instructor.nombre, 'Instructor Sintético Uno');

  const instructorIds = [...new Set(
    imported.body.data.ficha.sesiones.map((session) => String(session.instructor))
  )];
  assert.equal(instructorIds.length, 2);
  const importedFichaId = imported.body.data.ficha._id;
  for (const instructorId of instructorIds) {
    const evaluationResult = await request('/api/evaluations', {
      token: importedLearnerToken,
      method: 'POST',
      body: JSON.stringify({
        instructorId,
        fichaId: importedFichaId,
        respuestas: answersForEvaluation(),
        comentario: 'Evaluación de prueba para el bloque asignado.',
      }),
    });
    assert.equal(evaluationResult.response.status, 201, evaluationResult.body.message);
  }
  const duplicateInstructorEvaluation = await request('/api/evaluations', {
    token: importedLearnerToken,
    method: 'POST',
    body: JSON.stringify({
      instructorId: instructorIds[0],
      fichaId: importedFichaId,
      respuestas: answersForEvaluation(),
      comentario: 'Segundo intento de evaluación duplicada.',
    }),
  });
  assert.equal(duplicateInstructorEvaluation.response.status, 409);
  const evaluatedSchedule = await request('/api/management/learner/schedule', {
    token: importedLearnerToken,
  });
  const evaluatedFicha = evaluatedSchedule.body.data.find((ficha) => ficha.codigo === 'TEST-IMPORT-1');
  assert.equal(evaluatedFicha.instructoresEvaluados.length, 2);
  assert.equal(importedInstructorTokens.length, 2);

  const sentResetEmails = [];
  emailService.sendPasswordResetEmail = async (email, token) => {
    sentResetEmails.push({ email, token });
  };
  const recoveryRequest = (email) => request('/api/auth/password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  const firstResetRequest = await recoveryRequest('coordinacion@example.com');
  const firstResetToken = sentResetEmails[0].token;
  const secondResetRequest = await recoveryRequest('coordinacion@example.com');
  const activeResetToken = sentResetEmails[1].token;
  assert.equal(firstResetRequest.response.status, 202);
  assert.equal(secondResetRequest.response.status, 202);
  assert.equal(sentResetEmails[0].email, 'coordinacion@example.com');
  assert.notEqual(firstResetToken, activeResetToken);
  const { buildPasswordResetUrl } = emailService;
  assert.equal(
    buildPasswordResetUrl(activeResetToken),
    `http://localhost:5173/#resetToken=${activeResetToken}`
  );

  const resetTokenRecord = await PasswordResetToken.findOne({
    userId: (await CoordinatorProfile.findOne({ email: 'coordinacion@example.com' }))._id,
  }).lean();
  assert.equal(resetTokenRecord.tokenHash.length, 64);
  assert.notEqual(resetTokenRecord.tokenHash, activeResetToken);
  assert.ok(resetTokenRecord.expiresAt > new Date());

  const unknownAccountRequest = await recoveryRequest('no-existe@example.com');
  assert.equal(unknownAccountRequest.response.status, 202);
  assert.deepEqual(unknownAccountRequest.body, secondResetRequest.body);
  assert.equal(sentResetEmails.length, 2);

  delete process.env.SMTP_PASS;
  const configuredAccountWithoutMail = await recoveryRequest('coordinacion@example.com');
  const unknownAccountWithoutMail = await recoveryRequest('no-existe@example.com');
  assert.equal(configuredAccountWithoutMail.response.status, 503);
  assert.equal(unknownAccountWithoutMail.response.status, 503);
  assert.equal(configuredAccountWithoutMail.body.message, unknownAccountWithoutMail.body.message);
  process.env.SMTP_PASS = 'test-password';

  const rateLimitedRequest = await recoveryRequest('coordinacion@example.com');
  assert.equal(rateLimitedRequest.response.status, 429);

  const invalidatedTokenResult = await request('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token: firstResetToken, password: 'NuevaClaveSegura-2026' }),
  });
  assert.equal(invalidatedTokenResult.response.status, 400);

  const newPassword = 'NuevaClaveSegura-2026';
  const resetResult = await request('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token: activeResetToken, password: newPassword }),
  });
  assert.equal(resetResult.response.status, 200, resetResult.body.message);

  const replayResult = await request('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token: activeResetToken, password: newPassword }),
  });
  assert.equal(replayResult.response.status, 400);

  const oldCoordinatorSession = await request('/api/management/users', {
    token: coordinatorToken,
  });
  assert.equal(oldCoordinatorSession.response.status, 401);
  const newCoordinatorToken = await login(
    'coordinacion@example.com',
    'coordinador',
    newPassword
  );
  assert.ok(newCoordinatorToken);

  const expiredRawToken = 'a'.repeat(64);
  const coordinatorAfterReset = await CoordinatorProfile.findOne({
    email: 'coordinacion@example.com',
  }).select('+password +authVersion');
  await PasswordResetToken.create({
    userId: coordinatorAfterReset._id,
    tokenHash: createHash('sha256').update(expiredRawToken).digest('hex'),
    expiresAt: new Date(Date.now() - 1000),
  });
  const expiredResult = await request('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token: expiredRawToken, password: newPassword }),
  });
  assert.equal(expiredResult.response.status, 400);

  const profileUpdateResult = await request(`/api/management/users/${instructorId}`, {
    token: newCoordinatorToken,
    method: 'PATCH',
    body: JSON.stringify({
      nombre: 'Instructor de Prueba Actualizado',
      email: 'instructor.actualizado@example.com',
    }),
  });
  assert.equal(profileUpdateResult.response.status, 200, profileUpdateResult.body.message);
  const updatedInstructorProfile = await InstructorProfile.findById(instructorId).lean();
  assert.equal(updatedInstructorProfile.nombre, 'Instructor de Prueba Actualizado');
  assert.equal(updatedInstructorProfile.email, 'instructor.actualizado@example.com');
  assert.ok(await login('instructor.actualizado@example.com', 'instructor'));
});
