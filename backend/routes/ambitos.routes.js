const express = require('express');
const router = express.Router();
const { restrictToAdmin } = require('../middlewares/auth');
const {
  getAmbitosUsuario,
  getAllAmbitosAdmin,
  createAmbito,
  updateAmbito,
  updateUserAmbitos
} = require('../controllers/ambitosController');

// Rutas de usuario autenticado
router.get('/ambitos', getAmbitosUsuario);

// Rutas de administración
router.get('/ambitos/admin', restrictToAdmin, getAllAmbitosAdmin);
router.post('/ambitos', restrictToAdmin, createAmbito);
router.put('/ambitos/:id', restrictToAdmin, updateAmbito);
router.put('/ambitos/usuarios/:id_usuario', restrictToAdmin, updateUserAmbitos);

module.exports = router;
