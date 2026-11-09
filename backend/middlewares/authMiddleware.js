const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/jwt');

const protect = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Se requiere un token Bearer válido.',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (error) {
    if (error.message.includes('JWT_SECRET')) return next(error);
    return res.status(401).json({
      success: false,
      message: 'Token no válido o sesión expirada.',
    });
  }

  try {
    const user = await User.findOne({
      _id: decoded.id,
      activo: { $ne: false },
    }).select('-password +authVersion');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'La cuenta asociada al token ya no existe.',
      });
    }
    if ((decoded.authVersion || 0) !== (user.authVersion || 0)) {
      return res.status(401).json({
        success: false,
        message: 'La sesión ya no es válida. Inicia sesión nuevamente.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return res.status(403).json({
      success: false,
      message: 'Tu rol no tiene permiso para esta operación.',
    });
  }
  return next();
};

module.exports = { protect, authorize };
