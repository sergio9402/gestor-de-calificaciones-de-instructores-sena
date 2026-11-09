const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const {
  passwordResetConfirmLimit,
  passwordResetRequestLimit,
} = require('../middlewares/passwordResetRateLimit');

// Mapeo de rutas de autenticación
router.post('/login', authController.login);
router.post('/password-reset', passwordResetRequestLimit, authController.requestPasswordReset);
router.post(
  '/password-reset/confirm',
  passwordResetConfirmLimit,
  authController.confirmPasswordReset
);
router.get('/me/:id', protect, authController.getProfile);

module.exports = router;
