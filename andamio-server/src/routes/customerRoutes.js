const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const customerController = require('../controllers/customerController');

router.get('/', verifyToken, customerController.getCustomers);
router.post('/', verifyToken, customerController.createCustomer);

module.exports = router;