const jwt = require('jsonwebtoken');
const { getProfileModel, sanitizeUserProfile } = require('../services/userProfileService');
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
    const Profile = getProfileModel(decoded.rol);
    const profile = await Profile.findOne({
      _id: decoded.id,
      activo: { $ne: false },
    }).select('+authVersion');
    if (!profile) {
      return res.status(401).json({
        success: false,
        message: 'El perfil asociado al token ya no existe o está inactivo.',
      });
    }
    if ((decoded.authVersion || 0) !== (profile.authVersion || 0)) {
      return res.status(401).json({
        success: false,
        message: 'La sesión ya no es válida. Inicia sesión nuevamente.',
      });
    }

    req.user = sanitizeUserProfile(profile);
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
