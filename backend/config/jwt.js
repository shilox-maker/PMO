const crypto = require('crypto');

let JWT_SECRET = process.env.JWT_SECRET;
const isProdOrPre = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'pre';

if ((!JWT_SECRET || JWT_SECRET === 'pmo-secret-key-change-in-production') && isProdOrPre) {
  throw new Error('❌ ERROR CRÍTICO DE SEGURIDAD: La variable JWT_SECRET no está configurada o utiliza la clave por defecto en un entorno de producción/PRE.');
}

if (!JWT_SECRET || JWT_SECRET === 'pmo-secret-key-change-in-production') {
  if (process.env.NODE_ENV === 'test') {
    JWT_SECRET = 'pmo-secret-key-test-environment';
  } else {
    JWT_SECRET = 'pmo-secret-key-change-in-production';
  }
}


module.exports = {
  JWT_SECRET
};
