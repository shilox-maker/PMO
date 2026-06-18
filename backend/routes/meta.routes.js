const express = require('express');
const metaController = require('../controllers/metaController');

const router = express.Router();

router.get('/sedes', metaController.getSedes);
router.get('/contactos', metaController.getContactos);
router.get('/pms', metaController.getPms);
router.get('/changelog', metaController.getChangelog);
router.get('/portfolio/states', metaController.getPortfolioStates);
router.get('/portfolio/dashboard', metaController.getPortfolioDashboard);
router.get('/timeline', metaController.getTimeline);

module.exports = router;
