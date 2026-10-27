const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para proteger rutas mediante verificación de Token JWT
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decodificar token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secreto_sena_evaluaciones'
      );

      // Adjuntar usuario autenticado a la petición
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token no válido o sesión expirada',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Se requiere token Bearer en las cabeceras',
    });
  }
};

/**
 * Middleware para restringir acceso por roles (ej: 'coordinador')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `El rol "${req.user?.rol || 'anónimo'}" no tiene permisos para esta acción`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};

