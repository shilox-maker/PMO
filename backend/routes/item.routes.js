const express = require('express');
const itemController = require('../controllers/itemController');
const { validateTaskDate } = require('../middlewares/validation');

const router = express.Router();

// Invoices
router.post('/invoices', itemController.createInvoice);
router.put('/invoices/:id_interno_factura', itemController.updateInvoice);
router.delete('/invoices/:id_interno_factura', itemController.deleteInvoice);

// Scope Changes
router.post('/scope-changes', itemController.createScopeChange);
router.put('/scope-changes/:id_cambio', itemController.updateScopeChange);

// Risks
router.post('/risks', itemController.createRisk);
router.put('/risks/:id_riesgo', itemController.updateRisk);

// Issues
router.post('/issues', itemController.createIssue);
router.put('/issues/:id_incidencia', itemController.updateIssue);

// Tasks
router.post('/tasks', validateTaskDate, itemController.createTask);
router.put('/tasks/:id_tarea', validateTaskDate, itemController.updateTask);
router.delete('/tasks/:id_tarea', itemController.deleteTask);

// Lessons
router.get('/lessons', itemController.getLessons);
router.post('/lessons', itemController.createLesson);
router.put('/lessons/:id', itemController.updateLesson);
router.delete('/lessons/:id', itemController.deleteLesson);

// Comments
router.get('/projects/:id_proyecto/comments', itemController.getProjectComments);
router.post('/comments', itemController.createComment);
router.put('/comments/:id_comentario', itemController.updateComment);
router.delete('/comments/:id_comentario', itemController.deleteComment);

module.exports = router;
