const assert = require('node:assert/strict');
const test = require('node:test');
const { getEmailConfig } = require('../config/email');

function withEmailEnvironment(values, callback) {
  const keys = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_SECURE',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM',
    'FRONTEND_URL',
    'NODE_ENV',
  ];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) {
    if (Object.hasOwn(values, key)) process.env[key] = values[key];
    else delete process.env[key];
  }
  try {
    return callback();
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test('Gmail SMTP config accepts app passwords with display spaces', () => {
  const config = withEmailEnvironment({
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'sender@gmail.com',
    SMTP_PASS: 'abcd efgh ijkl mnop',
    SMTP_FROM: 'sender@gmail.com',
    FRONTEND_URL: 'http://localhost:5173',
    NODE_ENV: 'development',
  }, getEmailConfig);

  assert.equal(config.password, 'abcdefghijklmnop');
  assert.equal(config.secure, false);
  assert.equal(config.frontendUrl, 'http://localhost:5173');
});

test('non-Gmail SMTP passwords are not rewritten', () => {
  const config = withEmailEnvironment({
    SMTP_HOST: 'smtp.example.test',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'sender@example.test',
    SMTP_PASS: 'provider secret with spaces',
    SMTP_FROM: 'sender@example.test',
    FRONTEND_URL: 'http://localhost:5173',
    NODE_ENV: 'development',
  }, getEmailConfig);

  assert.equal(config.password, 'provider secret with spaces');
});
