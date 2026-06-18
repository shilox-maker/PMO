const express = require('express');
const projectController = require('../controllers/projectController');

const router = express.Router();

router.get('/projects', projectController.getProjects);
router.get('/projects/export', projectController.exportProjects);
router.get('/projects/:id_proyecto', projectController.getProjectDetail);
router.post('/projects', projectController.createProject);
router.put('/projects/:id_proyecto', projectController.updateProject);
router.delete('/projects/:id_proyecto', projectController.deleteProject);

// Participants RACI
router.post('/projects/:id_proyecto/participants', projectController.addParticipant);
router.delete('/projects/:id_proyecto/participants/:id_contacto', projectController.removeParticipant);

module.exports = router;
