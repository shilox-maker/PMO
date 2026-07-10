const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login, por favor intenta más tarde.' }
});

router.post('/login', loginLimiter, authController.login);
router.post('/login/azure', loginLimiter, authController.loginAzure);
router.get('/auth/verify', authController.verify);
router.put('/users/me/change-password', authController.changePassword);

module.exports = router;
