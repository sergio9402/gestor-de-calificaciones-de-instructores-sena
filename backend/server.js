require('dotenv').config();

const connectDB = require('./config/db');
const { getJwtSecret } = require('./config/jwt');
const createApp = require('./app');

const PORT = process.env.PORT || 5000;

async function startServer() {
  getJwtSecret();
  await connectDB();

  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[SENA Backend API] Servidor activo en puerto ${PORT}`);
    console.log(`[Modo] Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Salud] http://localhost:${PORT}/api/health`);
  });

  return server;
}

startServer().catch((error) => {
  console.error(`[Backend startup error] ${error.message}`);
  process.exitCode = 1;
});

process.on('unhandledRejection', (error) => {
  console.error(`[Unhandled Rejection] ${error.message}`);
});
