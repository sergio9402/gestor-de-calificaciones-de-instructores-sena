const rateLimit = require('express-rate-limit');

const passwordResetRequestLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Has realizado muchas solicitudes. Intenta de nuevo en unos minutos.',
  },
});

const passwordResetConfirmLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Has realizado muchos intentos. Solicita un enlace nuevo más tarde.',
  },
});

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 25,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Por seguridad, espera 15 minutos.',
  },
});

module.exports = {
  loginRateLimit,
  passwordResetRequestLimit,
  passwordResetConfirmLimit,
};
