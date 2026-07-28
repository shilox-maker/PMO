const express = require('express');
const projectController = require('../controllers/projectController');

const router = express.Router();

router.get('/projects', projectController.getProjects);
router.get('/projects/export', projectController.exportProjects);
router.get('/projects/:id_proyecto', projectController.getProjectDetail);
const { validateBody, projectCreateSchema, projectUpdateSchema } = require('../middlewares/validation');

router.post('/projects', validateBody(projectCreateSchema), projectController.createProject);
router.put('/projects/:id_proyecto', validateBody(projectUpdateSchema), projectController.updateProject);
router.delete('/projects/:id_proyecto', projectController.deleteProject);

// Participants RACI
router.post('/projects/:id_proyecto/participants', projectController.addParticipant);
router.delete('/projects/:id_proyecto/participants/:id_contacto', projectController.removeParticipant);

// State Tasks
router.post('/projects/:id_proyecto/apply-state-tasks', projectController.applyStateTasks);

// Planes de Comunicación y Auditoría de Envíos
router.get('/projects/:id_proyecto/planes-comunicacion', projectController.getCommunicationPlans);
router.post('/projects/:id_proyecto/planes-comunicacion', projectController.createCommunicationPlan);
router.put('/projects/:id_proyecto/planes-comunicacion/:id_plan', projectController.updateCommunicationPlan);
router.delete('/projects/:id_proyecto/planes-comunicacion/:id_plan', projectController.deleteCommunicationPlan);
router.post('/projects/:id_proyecto/planes-comunicacion/log', projectController.createCommunicationLog);
router.get('/projects/:id_proyecto/planes-comunicacion/log', projectController.getCommunicationLogs);

// Encuestas Cualitativas y Satisfacción
router.get('/projects/:id_proyecto/surveys', projectController.getProjectSurveys);
router.post('/projects/:id_proyecto/surveys', projectController.createProjectSurvey);
router.put('/projects/:id_proyecto/surveys/:id_encuesta', projectController.updateProjectSurvey);
router.delete('/projects/:id_proyecto/surveys/:id_encuesta', projectController.deleteProjectSurvey);

module.exports = router;


