const mongoose = require('mongoose');
const dns = require('node:dns');

// Configuración de DNS público para evitar el error ECONNREFUSED en registros SRV de MongoDB Atlas en Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignorar si el entorno bloquea la reasignación de DNS
}

/**
 * Conexión a base de datos MongoDB Atlas utilizando Mongoose
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`[MongoDB Atlas] Conexión establecida con éxito en host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] Error crítico de conexión: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

// Eventos de conexión de Mongoose para monitoreo continuo
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Atlas] Advertencia: Conexión perdida. Intentando reconectar...');
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB Atlas] Error interno de socket: ${err.message}`);
});

module.exports = connectDB;
