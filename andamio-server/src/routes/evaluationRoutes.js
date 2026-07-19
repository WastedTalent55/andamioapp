const express = require('express');

const router = express.Router();

const verifyToken = require('../../middleware/auth');

const controller = require('../controllers/evaluationController');



router.post(
    '/',
    verifyToken,
    controller.create
);



router.get(
    '/',
    verifyToken,
    controller.getAll
);



router.get(
    '/:id',
    controller.getOne
);



router.put(
    '/:id',
    controller.update
);



module.exports = router;