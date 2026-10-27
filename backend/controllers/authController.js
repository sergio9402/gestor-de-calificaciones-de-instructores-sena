const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middlewares/errorHandler');

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
    },
    process.env.JWT_SECRET || 'secreto_sena_evaluaciones',
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
   * Inicia sesión y genera token JWT
   * POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password, rol } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona el correo electrónico institucional',
      });
    }

    // Buscar usuario en base de datos
    const query = { email: email.toLowerCase() };
    if (rol) query.rol = rol;

    let user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas o usuario no registrado con ese rol',
      });
    }

    // Verificación de contraseña
    if (password && user.password && user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta',
      });
    }

    // Generar token JWT firmado
    const token = generateToken(user);

    // Retornar datos sin la contraseña
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: `Autenticación exitosa como ${user.rol.toUpperCase()}`,
      token,
      data: userResponse,
    });
  });

  /**
   * Consulta el usuario autenticado actual
   * GET /api/auth/me/:id
   */
  getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

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
