require('dotenv').config();
const mongoose = require('mongoose');
const EvaluationParticipation = require('../models/EvaluationParticipation');
const Ficha = require('../models/Ficha');

const LEGACY_INDEX = 'learnerId_1_fichaId_1_periodo_1';
const CURRENT_INDEX = {
  learnerId: 1,
  fichaId: 1,
  periodo: 1,
  instructorId: 1,
};

async function migrateEvaluationParticipation() {
  if (
    process.argv[2] !== '--run' ||
    process.env.ALLOW_EVALUATION_PARTICIPATION_MIGRATION !== 'true' ||
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error(
      'Migración bloqueada. Requiere --run, ALLOW_EVALUATION_PARTICIPATION_MIGRATION=true y un entorno no productivo.'
    );
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI no está configurada.');

  await mongoose.connect(process.env.MONGO_URI);
  const collection = EvaluationParticipation.collection;
  const legacyRows = await collection.find({ instructorId: { $exists: false } }).toArray();
  for (const row of legacyRows) {
    const ficha = await Ficha.findById(row.fichaId).select('instructor').lean();
    if (!ficha?.instructor) {
      throw new Error(`No se puede asociar la participación ${row._id} con un instructor.`);
    }
    await collection.updateOne(
      { _id: row._id, instructorId: { $exists: false } },
      { $set: { instructorId: ficha.instructor } }
    );
  }

  const indexes = await collection.indexes();
  if (indexes.some((index) => index.name === LEGACY_INDEX)) {
    await collection.dropIndex(LEGACY_INDEX);
  }
  await collection.createIndex(CURRENT_INDEX, { unique: true });
  console.log(`Migradas ${legacyRows.length} participaciones al índice por instructor.`);
}

migrateEvaluationParticipation()
  .catch((error) => {
    console.error('No se pudo migrar la participación de evaluaciones:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
