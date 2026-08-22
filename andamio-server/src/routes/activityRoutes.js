const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const activityController = require('../controllers/activityController');

router.get(
    '/recent',
    verifyToken,
    activityController.getRecent
);

module.exports = router;