const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiados intentos de inicio de sesión desde esta IP. Por favor, reintente en 15 minutos.' },
  keyGenerator: (req) => {
    const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    // Clean potential port attached to IP in reverse proxy (e.g. 188.85.166.18:56976)
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';
    const cleanIp = clientIp.replace(/:\d+$/, '');
    return rateLimit.ipKeyGenerator ? rateLimit.ipKeyGenerator(cleanIp) : cleanIp;
  },
  validate: { keyGeneratorIpFallback: false },
  skip: () => process.env.NODE_ENV !== 'production'
});


router.post('/login', loginLimiter, authController.login);
router.post('/login/azure', loginLimiter, authController.loginAzure);
router.get('/auth/verify', authController.verify);
router.put('/users/me/change-password', authController.changePassword);
router.patch('/users/me/language', authController.updateLanguage);

module.exports = router;
