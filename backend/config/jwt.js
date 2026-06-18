const crypto = require('crypto');

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'pmo-secret-key-change-in-production') {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ WARNING: JWT_SECRET not set or using default key in production! Generating a secure random key for this session...');
    JWT_SECRET = crypto.randomBytes(64).toString('hex');
  } else {
    JWT_SECRET = 'pmo-secret-key-change-in-production';
  }
}

module.exports = {
  JWT_SECRET
};
