const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const managementRoutes = require('./routes/managementRoutes');

function createApp() {
  const app = express();
  const allowedOrigins = (
    process.env.CLIENT_ORIGINS ||
    'http://localhost:3000,http://localhost:5173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por la política CORS.'));
    },
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      service: 'Sistema de Evaluación SENA - API Backend',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/instructors', instructorRoutes);
  app.use('/api/evaluations', evaluationRoutes);
  app.use('/api/management', managementRoutes);

  app.use((req, res, next) => {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    res.status(404);
    next(error);
  });
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
