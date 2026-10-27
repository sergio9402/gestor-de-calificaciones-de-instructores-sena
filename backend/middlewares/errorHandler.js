/**
 * Middleware centralizado para captura y formateo de errores
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message || 'Error interno del servidor';

  // Registrar error para depuración
  console.error(`[Error Handler] ${req.method} ${req.originalUrl}:`, err);

  // Error de Cast Mongoose (ID no válido)
  if (err.name === 'CastError') {
    const message = `Recurso no encontrado con ID: ${err.value}`;
    return res.status(404).json({
      success: false,
      message,
    });
  }

  // Error de duplicidad en MongoDB (Código 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    const message = `El ${field} ya se encuentra registrado en el sistema`;
    return res.status(400).json({
      success: false,
      message,
    });
  }

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message,
    });
  }

  // Error HTTP personalizado (si tiene statusCode)
  const statusCode = err.statusCode || res.statusCode >= 400 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

/**
 * Wrapper de conveniencia para controladores asíncronos (evita try/catch repetitivo)
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
};

