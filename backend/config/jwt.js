const MIN_SECRET_LENGTH = 32;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      'JWT_SECRET debe estar configurada y tener al menos 32 caracteres.'
    );
  }
  return secret;
};

module.exports = { getJwtSecret };
