const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const customerController = require('../controllers/customerController');

router.get('/', verifyToken, customerController.getCustomers);
router.post('/', verifyToken, customerController.createCustomer);
router.get('/count', verifyToken, customerController.getCount);
router.get('/:id', verifyToken, customerController.getCustomerById);
router.put('/:id', verifyToken, customerController.updateCustomer);
router.delete('/:id', verifyToken, customerController.deleteCustomer);

module.exports = router;