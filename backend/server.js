const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middlewares/errorHandler');

// Rutas modulares
const authRoutes = require('./routes/authRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');

// 1. Cargar variables de entorno
dotenv.config();

// 2. Conectar a MongoDB Atlas
connectDB();

// 3. Inicializar aplicación Express
const app = express();

// 4. Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Endpoint de verificación de estado (Healthcheck)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Sistema de Evaluación SENA - API Backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 6. Montaje de rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/evaluations', evaluationRoutes);

// 7. Manejador de rutas no encontradas (404)
app.use((req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// 8. Middleware centralizado para captura de errores
app.use(errorHandler);

// 9. Iniciar el servidor
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`[SENA Backend API] Servidor activo en puerto ${PORT}`);
  console.log(`[Modo] Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Salud] http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

// Manejo elegante de excepciones no controladas en el proceso
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] Error: ${err.message}`);
});

module.exports = app;

