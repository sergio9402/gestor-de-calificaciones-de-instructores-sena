const { promisify } = require('node:util');
const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

const isPasswordHash = (value) =>
  typeof value === 'string' && value.startsWith('scrypt$');

const hashPassword = async (password) => {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
};

const verifyPassword = async (password, storedPassword) => {
  if (typeof password !== 'string' || typeof storedPassword !== 'string') {
    return false;
  }

  if (!isPasswordHash(storedPassword)) {
    const provided = Buffer.from(password);
    const stored = Buffer.from(storedPassword);
    return provided.length === stored.length && timingSafeEqual(provided, stored);
  }

  const [, saltHex, hashHex] = storedPassword.split('$');
  if (!saltHex || !hashHex || !/^[\da-f]+$/i.test(saltHex) || !/^[\da-f]+$/i.test(hashHex)) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length !== KEY_LENGTH) return false;

  const actual = await scryptAsync(password, salt, KEY_LENGTH);
  return timingSafeEqual(actual, expected);
};

module.exports = { hashPassword, isPasswordHash, verifyPassword };
