const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getJwtSecret } = require('../config/jwt');
const { isPasswordHash, verifyPassword } = require('../utils/password');
const passwordResetService = require('../services/passwordResetService');

/**
 * Genera un token JWT para la sesión
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      authVersion: user.authVersion || 0,
    },
    getJwtSecret(),
    {
      expiresIn: '8h', // Jornada laboral o de formación SENA
    }
  );
};

/**
 * Controlador de Autenticación y Roles con JWT
 */
class AuthController {
  /**
   * Inicia sesión y genera token JWT con validación estricta de credenciales
   * POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password, rol } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico y la contraseña son obligatorios',
      });
    }

    // Buscar usuario en base de datos
    const query = { email: email.toLowerCase().trim() };
    if (rol) query.rol = rol;

    const user = await User.findOne({
      ...query,
      activo: { $ne: false },
    }).select('+password +authVersion');

    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos.',
      });
    }

    if (!isPasswordHash(user.password)) {
      user.password = password;
      await user.save();
    }

    // Generar token JWT firmado
    const token = generateToken(user);

    // Retornar datos sin la contraseña
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.authVersion;

    res.status(200).json({
      success: true,
      message: `Autenticación exitosa como ${user.rol.toUpperCase()}`,
      token,
      data: userResponse,
    });
  });

  /**
   * Solicita un enlace de recuperación sin revelar si el correo está registrado.
   * POST /api/auth/password-reset
   */
  requestPasswordReset = asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Ingresa un correo electrónico válido.',
      });
    }

    await passwordResetService.requestReset(email);
    return res.status(202).json({
      success: true,
      message: 'Si el correo está registrado, recibirás instrucciones para recuperar el acceso.',
    });
  });

  /**
   * Consume un enlace de un solo uso y cambia la contraseña.
   * POST /api/auth/password-reset/confirm
   */
  confirmPasswordReset = asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const { token, password } = req.body || {};
    if (
      typeof token !== 'string' ||
      !/^[\da-f]{64}$/i.test(token) ||
      typeof password !== 'string' ||
      password.length < 12 ||
      password.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: 'El enlace o la nueva contraseña no son válidos. La contraseña debe tener entre 12 y 128 caracteres.',
      });
    }

    await passwordResetService.resetPassword(token, password);
    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
    });
  });

  /**
   * Consulta el usuario autenticado actual
   * GET /api/auth/me/:id
   */
  getProfile = asyncHandler(async (req, res) => {
    const isCoordinator = req.user.rol === 'coordinador';
    if (!isCoordinator && String(req.user._id) !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para consultar este perfil.',
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  });
}

module.exports = new AuthController();
