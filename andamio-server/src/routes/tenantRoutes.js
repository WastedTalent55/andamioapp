const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const verifyToken = require('../middleware/auth');

router.get(
    '/config', 
    verifyToken, 
    tenantController.getTenantConfig 
);

router.post(
    '/update', 
    verifyToken, 
    tenantController.updateTenantConfig 
); 

module.exports = router;