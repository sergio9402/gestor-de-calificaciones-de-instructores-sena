const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('node:dns');

// Solución para Windows: Forzar DNS de Google/Cloudflare para resolver registros SRV de MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignorar si el entorno bloquea la reasignación
}

const User = require('../models/User');
const Evaluation = require('../models/Evaluation');
const connectDB = require('./db');
const { hashPassword } = require('../utils/password');

dotenv.config();

const seedInstructors = [
  {
    nombre: "Ing. Carlos Andrés Mendoza",
    email: "carlos.mendoza@sena.edu.co",
    rol: "instructor",
    especialidad: "Análisis y Desarrollo de Software (ADSO) - Backend & APIs",
    centro: "Centro de Teleinformática y Producción Industrial - Regional Cauca",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    fichasAsignadas: ["2670142", "2715890"],
    estado: "En Formación",
    horario: "07:00 AM - 01:00 PM",
    promedioGeneral: 4.8,
    promedioMetodologia: 4.7,
    promedioTecnico: 4.9,
    totalEvaluaciones: 42,
  },
  {
    nombre: "Dra. Laura Patricia Gómez",
    email: "laura.gomez@sena.edu.co",
    rol: "instructor",
    especialidad: "Diseño Web UI/UX y Desarrollo Frontend (React & Tailwind)",
    centro: "Centro de Diseño y Metrología - Regional Distrito Capital",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    fichasAsignadas: ["2821450"],
    estado: "En Formación",
    horario: "07:00 AM - 01:00 PM",
    promedioGeneral: 4.9,
    promedioMetodologia: 4.9,
    promedioTecnico: 4.8,
    totalEvaluaciones: 56,
  },
  {
    nombre: "Lic. Jorge Eliecer Torres",
    email: "jorge.torres@sena.edu.co",
    rol: "instructor",
    especialidad: "Bases de Datos Relacionales y NoSQL (MySQL, MongoDB)",
    centro: "Centro de Servicios y Gestión Empresarial - Regional Antioquia",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    fichasAsignadas: ["2901234"],
    estado: "Disponible",
    horario: "06:00 PM - 10:00 PM",
    promedioGeneral: 4.4,
    promedioMetodologia: 4.2,
    promedioTecnico: 4.7,
    totalEvaluaciones: 38,
  },
  {
    nombre: "Dra. Sofía Restrepo Cárdenas",
    email: "sofia.restrepo@sena.edu.co",
    rol: "coordinador",
    especialidad: "Coordinación Académica y Aseguramiento de Calidad",
    centro: "Dirección General SENA",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80",
    fichasAsignadas: [],
    estado: "Disponible",
    horario: "08:00 AM - 05:00 PM",
    promedioGeneral: 5.0,
    promedioMetodologia: 5.0,
    promedioTecnico: 5.0,
    totalEvaluaciones: 0,
  }
];

const seedData = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed con datos de demostración está deshabilitado en producción.');
  }

  if (
    !process.env.MONGO_URI ||
    process.env.MONGO_URI.includes('<usuario>') ||
    process.env.MONGO_URI.includes('<password>')
  ) {
    throw new Error('Configura MONGO_URI con una conexión válida en backend/.env.');
  }
  if (!process.env.DEMO_INITIAL_PASSWORD || process.env.DEMO_INITIAL_PASSWORD.length < 12) {
    throw new Error(
      'Configura DEMO_INITIAL_PASSWORD con al menos 12 caracteres para cargar datos demo.'
    );
  }

  await connectDB();
  if (await User.exists({}) || await Evaluation.exists({})) {
    throw new Error(
      'La base de datos no está vacía. El seed se canceló para preservar los datos existentes.'
    );
  }

  console.log('[Seed] Insertando usuarios de demostración...');
  const usersWithHashedPasswords = await Promise.all(
    seedInstructors.map(async (instructor) => ({
      ...instructor,
      password: await hashPassword(process.env.DEMO_INITIAL_PASSWORD),
    }))
  );
  const createdUsers = await User.create(usersWithHashedPasswords);

  const carlosInstructor = createdUsers.find(
    (user) => user.email === 'carlos.mendoza@sena.edu.co'
  );
  if (carlosInstructor) {
    await Evaluation.create([
      {
        instructorId: carlosInstructor._id,
        calificacionMetodologia: 5,
        calificacionTecnica: 5,
        comentario: 'Excelente dominio de Node.js y arquitecturas limpias.',
      },
      {
        instructorId: carlosInstructor._id,
        calificacionMetodologia: 4,
        calificacionTecnica: 5,
        comentario: 'Muy buena pedagogía en las sesiones de asesoría técnica.',
      },
    ]);
  }

  console.log('[Seed] Datos de demostración cargados.');
};

if (process.argv[2] === '--run') {
  seedData()
    .catch((error) => {
      console.error(`[Seed Error] ${error.message}`);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}

module.exports = seedData;
