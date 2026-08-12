const express = require('express');
const { getPendingAssistant } = require('../controllers/assistantController');

const router = express.Router();

router.get('/assistant/pending', getPendingAssistant);

module.exports = router;
