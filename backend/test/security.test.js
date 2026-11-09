const test = require('node:test');
const assert = require('node:assert/strict');

const { getJwtSecret } = require('../config/jwt');
const { authorize, protect } = require('../middlewares/authMiddleware');
const { errorHandler } = require('../middlewares/errorHandler');
const authRoutes = require('../routes/authRoutes');
const evaluationRoutes = require('../routes/evaluationRoutes');
const instructorRoutes = require('../routes/instructorRoutes');
const managementRoutes = require('../routes/managementRoutes');
const Evaluation = require('../models/Evaluation');
const EvaluationParticipation = require('../models/EvaluationParticipation');
const Ficha = require('../models/Ficha');
const User = require('../models/User');
const instructorService = require('../services/instructorService');
const {
  hashPassword,
  isPasswordHash,
  verifyPassword,
} = require('../utils/password');

test('new passwords are salted hashes and verify correctly', async () => {
  const firstHash = await hashPassword('una-clave-segura');
  const secondHash = await hashPassword('una-clave-segura');

  assert.notEqual(firstHash, secondHash);
  assert.equal(isPasswordHash(firstHash), true);
  assert.equal(await verifyPassword('una-clave-segura', firstHash), true);
  assert.equal(await verifyPassword('otra-clave', firstHash), false);
});

test('legacy plaintext passwords can be verified for migration', async () => {
  assert.equal(await verifyPassword('clave-antigua', 'clave-antigua'), true);
  assert.equal(await verifyPassword('clave-incorrecta', 'clave-antigua'), false);
});

test('JWT secret must be configured with at least 32 characters', () => {
  const previousSecret = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(getJwtSecret, /JWT_SECRET/);

    process.env.JWT_SECRET = 'short';
    assert.throws(getJwtSecret, /32 caracteres/);

    process.env.JWT_SECRET = 'a'.repeat(32);
    assert.equal(getJwtSecret(), 'a'.repeat(32));
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('protected routes reject requests without a Bearer token', async () => {
  let statusCode;
  let responseBody;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await protect({ headers: {} }, res, assert.fail);
  assert.equal(statusCode, 401);
  assert.match(responseBody.message, /token Bearer/);
});

test('role authorization denies users without an allowed role', () => {
  let statusCode;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };

  authorize('coordinador')(
    { user: { rol: 'instructor' } },
    res,
    assert.fail
  );
  assert.equal(statusCode, 403);
});

test('management and evaluation routes require role-based authentication', () => {
  const assertProtected = (router, path, method, routerProtected = false) => {
    const route = router.stack.find(
      (layer) => layer.route?.path === path && layer.route.methods[method]
    );
    assert.ok(route, `Expected route ${method.toUpperCase()} ${path}`);
    if (routerProtected) {
      assert.equal(router.stack[0].handle, protect);
    } else {
      assert.equal(route.route.stack[0].handle, protect);
    }
  };

  assertProtected(authRoutes, '/me/:id', 'get');
  assertProtected(instructorRoutes, '/metrics/summary', 'get');
  assertProtected(instructorRoutes, '/:id/status', 'patch');
  assertProtected(evaluationRoutes, '/recent', 'get');
  assertProtected(evaluationRoutes, '/instructor/:instructorId', 'get');
  assertProtected(managementRoutes, '/learner/schedule', 'get', true);
  assertProtected(managementRoutes, '/instructor/fichas', 'get', true);
  assertProtected(managementRoutes, '/users', 'get', true);

  const createEvaluationRoute = evaluationRoutes.stack.find(
    (layer) => layer.route?.path === '/' && layer.route.methods.post
  );
  assert.ok(createEvaluationRoute);
  assert.equal(createEvaluationRoute.route.stack[0].handle, protect);
  let deniedStatus;
  const denyResponse = {
    status(code) {
      deniedStatus = code;
      return this;
    },
    json() {
      return this;
    },
  };
  createEvaluationRoute.route.stack[1].handle(
    { user: { rol: 'instructor' } },
    denyResponse,
    assert.fail
  );
  assert.equal(deniedStatus, 403);
});

test('evaluation records do not contain learner identity and learner role is supported', () => {
  assert.equal(Evaluation.schema.path('learnerId'), undefined);
  assert.ok(Evaluation.schema.path('fichaId'));
  assert.equal(EvaluationParticipation.schema.options.timestamps, false);
  assert.deepEqual(
    EvaluationParticipation.schema.indexes().find(([fields]) =>
      Object.keys(fields).includes('learnerId')
    )[0],
    { learnerId: 1, fichaId: 1, periodo: 1, instructorId: 1 }
  );
  assert.deepEqual(User.schema.path('rol').enumValues, [
    'instructor',
    'coordinador',
    'aprendiz',
  ]);
  assert.ok(Ficha.schema.path('novedades'));
  assert.ok(Ficha.schema.path('aprendices'));
});

test('ficha schedule must end after it starts', async () => {
  const ficha = new Ficha({
    codigo: 'TEST-1',
    programa: 'Programa prueba',
    instructor: '507f1f77bcf86cd799439011',
    horaInicio: '13:00',
    horaFin: '12:00',
  });
  const error = await ficha.validate().then(
    () => null,
    (validationError) => validationError
  );

  assert.ok(error);
  assert.match(error.errors.horaFin.message, /posterior al inicio/);
});

test('institutional metrics use recorded evaluations and a weighted average', async () => {
  const originalFind = User.find;
  User.find = () => ({
    lean: async () => [
      { estado: 'Disponible', totalEvaluaciones: 2, promedioGeneral: 4, promedioMetodologia: 3, promedioTecnico: 5 },
      { estado: 'En Formación', totalEvaluaciones: 1, promedioGeneral: 2, promedioMetodologia: 1, promedioTecnico: 3 },
      { estado: 'Disponible', totalEvaluaciones: 0, promedioGeneral: 5, promedioMetodologia: 5, promedioTecnico: 5 },
    ],
  });

  try {
    const metrics = await instructorService.getInstitutionalMetrics();
    assert.equal(metrics.totalInstructores, 3);
    assert.equal(metrics.totalEvaluaciones, 3);
    assert.equal(metrics.promedioGlobal, 3.33);
    assert.equal(metrics.promedioMetodologia, 2.33);
    assert.equal(metrics.promedioTecnico, 4.33);
  } finally {
    User.find = originalFind;
  }
});

test('central error handler preserves explicit HTTP status codes', () => {
  const previousConsoleError = console.error;
  let statusCode;
  let responseBody;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  console.error = () => {};
  try {
    errorHandler(
      Object.assign(new Error('No encontrado'), { statusCode: 404 }),
      { method: 'GET', originalUrl: '/api/resource/1' },
      res,
      assert.fail
    );
  } finally {
    console.error = previousConsoleError;
  }

  assert.equal(statusCode, 404);
  assert.equal(responseBody.message, 'No encontrado');
});
