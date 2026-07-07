const express = require('express');
const itemController = require('../controllers/itemController');
const {
  validateBody,
  invoiceCreateSchema,
  invoiceUpdateSchema,
  scopeChangeCreateSchema,
  scopeChangeUpdateSchema,
  riskCreateSchema,
  riskUpdateSchema,
  issueCreateSchema,
  issueUpdateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  commentCreateSchema,
  commentUpdateSchema,
  lessonCreateSchema,
  lessonUpdateSchema
} = require('../middlewares/validation');

const router = express.Router();

// Invoices
router.post('/invoices', validateBody(invoiceCreateSchema), itemController.createInvoice);
router.put('/invoices/:id_interno_factura', validateBody(invoiceUpdateSchema), itemController.updateInvoice);
router.delete('/invoices/:id_interno_factura', itemController.deleteInvoice);

// Scope Changes
router.post('/scope-changes', validateBody(scopeChangeCreateSchema), itemController.createScopeChange);
router.put('/scope-changes/:id_cambio', validateBody(scopeChangeUpdateSchema), itemController.updateScopeChange);

// Risks
router.post('/risks', validateBody(riskCreateSchema), itemController.createRisk);
router.put('/risks/:id_riesgo', validateBody(riskUpdateSchema), itemController.updateRisk);

// Issues
router.post('/issues', validateBody(issueCreateSchema), itemController.createIssue);
router.put('/issues/:id_incidencia', validateBody(issueUpdateSchema), itemController.updateIssue);

// Tasks
router.post('/tasks', validateBody(taskCreateSchema), itemController.createTask);
router.put('/tasks/:id_tarea', validateBody(taskUpdateSchema), itemController.updateTask);
router.delete('/tasks/:id_tarea', itemController.deleteTask);

// Lessons
router.get('/lessons', itemController.getLessons);
router.post('/lessons', validateBody(lessonCreateSchema), itemController.createLesson);
router.put('/lessons/:id', validateBody(lessonUpdateSchema), itemController.updateLesson);
router.delete('/lessons/:id', itemController.deleteLesson);

// Comments
router.get('/projects/:id_proyecto/comments', itemController.getProjectComments);
router.post('/comments', validateBody(commentCreateSchema), itemController.createComment);
router.put('/comments/:id_comentario', validateBody(commentUpdateSchema), itemController.updateComment);
router.delete('/comments/:id_comentario', itemController.deleteComment);

module.exports = router;
