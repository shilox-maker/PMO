const express = require('express');
const adminController = require('../controllers/adminController');
const { restrictToAdmin } = require('../middlewares/auth');

const router = express.Router();

// Apply restrictToAdmin to all routes in this router
router.use(restrictToAdmin);

// Sedes admin
router.post('/admin/sedes', adminController.createSede);
router.put('/admin/sedes/:id_sede', adminController.updateSede);
router.delete('/admin/sedes/:id_sede', adminController.deleteSede);

// States admin
router.get('/admin/states', adminController.getStates);
router.post('/admin/states', adminController.createState);
router.put('/admin/states/:id_estado', adminController.updateState);
router.delete('/admin/states/:id_estado', adminController.deleteState);

// Users admin
router.get('/admin/users', adminController.getUsers);
router.post('/admin/users', adminController.createUser);
router.put('/admin/users/:id_usuario', adminController.updateUser);
router.delete('/admin/users/:id_usuario', adminController.deleteUser);

module.exports = router;
