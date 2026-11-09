const nodemailer = require('nodemailer');

function getEmailConfig() {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (
    !process.env.SMTP_HOST ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.SMTP_FROM
  ) {
    const error = new Error('El servicio de correo no está configurado.');
    error.statusCode = 503;
    throw error;
  }

  let parsedFrontendUrl;
  try {
    parsedFrontendUrl = new URL(frontendUrl);
  } catch {
    const error = new Error('La URL pública de la aplicación no está configurada correctamente.');
    error.statusCode = 503;
    throw error;
  }

  if (
    !['http:', 'https:'].includes(parsedFrontendUrl.protocol) ||
    parsedFrontendUrl.search ||
    parsedFrontendUrl.hash ||
    (process.env.NODE_ENV === 'production' && parsedFrontendUrl.protocol !== 'https:')
  ) {
    const error = new Error('La URL pública de la aplicación no está configurada correctamente.');
    error.statusCode = 503;
    throw error;
  }

  return {
    host: process.env.SMTP_HOST,
    port,
    secure,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    frontendUrl: parsedFrontendUrl.toString().replace(/\/$/, ''),
  };
}

function buildPasswordResetUrl(token) {
  const { frontendUrl } = getEmailConfig();
  return `${frontendUrl}/#resetToken=${encodeURIComponent(token)}`;
}

async function sendPasswordResetEmail(email, token) {
  const config = getEmailConfig();
  const resetUrl = buildPasswordResetUrl(token);
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  try {
    await transporter.sendMail({
      from: config.from,
      to: email,
      subject: 'Restablece tu contraseña',
      text: [
        'Recibimos una solicitud para restablecer la contraseña de tu cuenta.',
        `Usa este enlace antes de 30 minutos: ${resetUrl}`,
        'Si no solicitaste el cambio, puedes ignorar este mensaje.',
      ].join('\n\n'),
      html: [
        '<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>',
        `<p><a href="${resetUrl}">Crear una nueva contraseña</a></p>`,
        '<p>El enlace vence en 30 minutos y solo se puede usar una vez.</p>',
        '<p>Si no solicitaste el cambio, puedes ignorar este mensaje.</p>',
      ].join(''),
    });
  } catch (error) {
    console.error('[Email service] No se pudo enviar el correo de recuperación:', error.code || 'SMTP_ERROR');
    const deliveryError = new Error('No fue posible enviar el correo de recuperación. Intenta de nuevo más tarde.');
    deliveryError.statusCode = 503;
    throw deliveryError;
  } finally {
    transporter.close();
  }
}

module.exports = {
  buildPasswordResetUrl,
  getEmailConfig,
  sendPasswordResetEmail,
};
