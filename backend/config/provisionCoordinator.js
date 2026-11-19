require('dotenv').config({ path: require('node:path').resolve(__dirname, '..', '.env') });

const { randomUUID } = require('node:crypto');
const readline = require('node:readline/promises');
const mongoose = require('mongoose');
const CoordinatorProfile = require('../models/CoordinatorProfile');
const { createUserProfile } = require('../services/userProfileService');

const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
const bootstrapLockId = 'initial-coordinator';

async function createInitialCoordinator({ nombre, email, password }) {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Conecta MongoDB antes de aprovisionar el coordinador.');
  }
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 100) {
    throw new Error('El nombre es obligatorio y no puede superar 100 caracteres.');
  }
  if (typeof email !== 'string' || !emailPattern.test(email.trim())) {
    throw new Error('Ingresa un correo electrónico válido.');
  }
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    throw new Error('La contraseña debe tener entre 12 y 128 caracteres.');
  }
  if (await CoordinatorProfile.exists({})) {
    throw new Error('Ya existe un perfil de coordinación. Usa la recuperación por correo.');
  }

  const locks = mongoose.connection.collection('system_bootstrap_locks');
  const claimToken = randomUUID();
  try {
    await locks.insertOne({
      _id: bootstrapLockId,
      claimToken,
      createdAt: new Date(),
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(
        'El aprovisionamiento inicial ya se ejecutó o quedó pendiente. Revisa la base con el responsable del sistema.'
      );
    }
    throw error;
  }

  try {
    if (await CoordinatorProfile.exists({})) {
      throw new Error('Ya existe un perfil de coordinación. Usa la recuperación por correo.');
    }
    return await createUserProfile({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password,
      rol: 'coordinador',
      activo: true,
    });
  } catch (error) {
    await locks.deleteOne({ _id: bootstrapLockId, claimToken });
    throw error;
  }
}

async function askLine(prompt) {
  const interfaceInstance = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    return await interfaceInstance.question(prompt);
  } finally {
    interfaceInstance.close();
  }
}

function askHidden(prompt) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    return Promise.reject(new Error('Ejecuta este comando desde una terminal interactiva.'));
  }

  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      input.removeListener('data', onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          finish(new Error('Aprovisionamiento cancelado.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u0008' || character === '\u007f') {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write('\b \b');
          }
          continue;
        }
        if (character >= ' ') {
          value += character;
          process.stdout.write('*');
        }
      }
    };

    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

async function run() {
  if (process.argv[2] !== '--run') {
    throw new Error('Ejecuta el comando con --run para confirmar la operación.');
  }
  if (process.env.ALLOW_COORDINATOR_BOOTSTRAP !== 'true') {
    throw new Error('Configura ALLOW_COORDINATOR_BOOTSTRAP=true para habilitar el aprovisionamiento.');
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI no está configurada.');

  const production = process.env.NODE_ENV === 'production';
  if (
    production &&
    process.env.ALLOW_PRODUCTION_COORDINATOR_BOOTSTRAP !== 'true'
  ) {
    throw new Error(
      'En producción también se requiere ALLOW_PRODUCTION_COORDINATOR_BOOTSTRAP=true.'
    );
  }

  const name = await askLine('Nombre completo: ');
  const email = await askLine('Correo de coordinación: ');
  const password = await askHidden('Contraseña nueva (no se mostrará): ');
  const passwordConfirmation = await askHidden('Confirma la contraseña: ');
  if (password !== passwordConfirmation) {
    throw new Error('Las contraseñas no coinciden.');
  }

  const confirmation = production
    ? 'CREAR COORDINADOR EN PRODUCCION'
    : 'CREAR COORDINADOR';
  const typedConfirmation = await askLine(`Escribe "${confirmation}" para continuar: `);
  if (typedConfirmation !== confirmation) {
    throw new Error('La confirmación no coincide. No se creó ningún perfil.');
  }

  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: true,
    serverSelectionTimeoutMS: 8000,
  });
  await createInitialCoordinator({ nombre: name, email, password });
  console.log('Perfil de coordinación creado. Entrega las credenciales por un canal seguro.');
}

if (require.main === module) {
  run()
    .catch((error) => {
      console.error(`[Aprovisionamiento] ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    });
}

module.exports = { createInitialCoordinator };
