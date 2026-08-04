const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { checkMaintenance } = require('../middlewares/maintenance');
const { globalSearch } = require('../controllers/searchController');

router.get('/global', verifyToken, checkMaintenance, globalSearch);

module.exports = router;
