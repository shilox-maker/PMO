const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de inicio de sesión desde esta IP. Por favor, reintente en 15 minutos.' },
  skip: () => process.env.NODE_ENV === 'test'
});


router.post('/login', loginLimiter, authController.login);
router.post('/login/azure', loginLimiter, authController.loginAzure);
router.get('/auth/verify', authController.verify);
router.put('/users/me/change-password', authController.changePassword);
router.patch('/users/me/language', authController.updateLanguage);

module.exports = router;
