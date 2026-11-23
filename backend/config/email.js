function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || process.env.SMTP_FROM?.trim();
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();

  if (!apiKey || !from) {
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
    apiKey,
    from,
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

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: [email],
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
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Email service] Error HTTP de Resend:', response.status, errorBody);
      throw new Error('RESEND_HTTP_ERROR');
    }
  } catch (error) {
    console.error('[Email service] No se pudo enviar el correo de recuperación:', error.message || error);
    const deliveryError = new Error(
      'No fue posible enviar el correo de recuperación. Intenta de nuevo más tarde.'
    );
    deliveryError.statusCode = 503;
    throw deliveryError;
  }
}

module.exports = {
  buildPasswordResetUrl,
  getEmailConfig,
  sendPasswordResetEmail,
};