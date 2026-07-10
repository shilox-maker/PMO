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

// Portfolios admin
router.post('/admin/portfolios', adminController.createPortfolio);
router.put('/admin/portfolios/:id', adminController.updatePortfolio);
router.delete('/admin/portfolios/:id', adminController.deletePortfolio);

// CAPEX Types admin
router.get('/admin/capex-types', adminController.getTiposCapex);
router.post('/admin/capex-types', adminController.createTipoCapex);
router.put('/admin/capex-types/:id', adminController.updateTipoCapex);
router.delete('/admin/capex-types/:id', adminController.deleteTipoCapex);
router.post('/admin/capex-types/:id/subtypes', adminController.createSubtipoCapex);
router.put('/admin/capex-subtypes/:id', adminController.updateSubtipoCapex);
router.delete('/admin/capex-subtypes/:id', adminController.deleteSubtipoCapex);

// Portfolio Budgets admin
router.post('/admin/portfolios/:id/budgets', adminController.createPortfolioBudget);
router.put('/admin/portfolio-budgets/:budgetId', adminController.updatePortfolioBudget);
router.delete('/admin/portfolio-budgets/:budgetId', adminController.deletePortfolioBudget);

module.exports = router;
