const express = require('express');
const vendorController = require('../controllers/vendorController');
const { restrictToAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/vendors', vendorController.getVendors);
router.get('/vendors/:id_proveedor', vendorController.getVendorDetail);
router.post('/vendors', vendorController.createVendor);
router.put('/vendors/:id_proveedor', vendorController.updateVendor);
router.delete('/vendors/:id_proveedor', restrictToAdmin, vendorController.deleteVendor);

// Contacts
router.post('/contacts', vendorController.createContact);
router.delete('/contacts/:id_contacto', vendorController.deleteContact);

module.exports = router;
