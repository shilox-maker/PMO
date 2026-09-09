const express = require('express');
const itemController = require('../controllers/itemController');
const {
  validateBody,
  invoiceCreateSchema,
  invoiceUpdateSchema,
  invoiceBatchCreateSchema,
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
router.post('/invoices/batch', validateBody(invoiceBatchCreateSchema), itemController.createBatchInvoices);
router.post('/invoices', validateBody(invoiceCreateSchema), itemController.createInvoice);
router.put('/invoices/:id_interno_factura', validateBody(invoiceUpdateSchema), itemController.updateInvoice);
router.delete('/invoices/:id_interno_factura', itemController.deleteInvoice);


// Scope Changes
router.post('/scope-changes', validateBody(scopeChangeCreateSchema), itemController.createScopeChange);
router.put('/scope-changes/:id_cambio', validateBody(scopeChangeUpdateSchema), itemController.updateScopeChange);
router.delete('/scope-changes/:id_cambio', itemController.deleteScopeChange);

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

// Operational Comments
router.get('/projects/:id_proyecto/comments', itemController.getProjectComments);
router.post('/projects/:id_proyecto/comments', validateBody(commentCreateSchema), itemController.createComment);
router.put('/projects/:id_proyecto/comments/:id_comentario', validateBody(commentUpdateSchema), itemController.updateComment);
router.delete('/projects/:id_proyecto/comments/:id_comentario', itemController.deleteComment);

router.post('/comments', validateBody(commentCreateSchema), itemController.createComment);
router.put('/comments/:id_comentario', validateBody(commentUpdateSchema), itemController.updateComment);
router.delete('/comments/:id_comentario', itemController.deleteComment);

// Direction Comments (Exclusivos Dirección / Administrador)
router.get('/projects/:id_proyecto/direction-comments', itemController.getProjectDirectionComments);
router.post('/projects/:id_proyecto/direction-comments', validateBody(commentCreateSchema), itemController.createDirectionComment);
router.put('/projects/:id_proyecto/direction-comments/:id_comentario', validateBody(commentUpdateSchema), itemController.updateDirectionComment);
router.delete('/projects/:id_proyecto/direction-comments/:id_comentario', itemController.deleteDirectionComment);

router.post('/direction-comments', validateBody(commentCreateSchema), itemController.createDirectionComment);
router.put('/direction-comments/:id_comentario', validateBody(commentUpdateSchema), itemController.updateDirectionComment);
router.delete('/direction-comments/:id_comentario', itemController.deleteDirectionComment);

module.exports = router;
