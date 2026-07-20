const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const boardController = require('../controllers/boardController');

router.get(
    '/summary',
    verifyToken,
    boardController.getSummary
);

module.exports = router;