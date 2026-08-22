const express = require('express');

const router = express.Router();

const verifyToken = require('../middleware/auth');

const controller = require('../controllers/evaluationController');



router.post(
    '/',
    verifyToken,
    controller.create
);

router.get(
    '/count', 
    verifyToken, 
    controller.getCount
);

router.get(
    '/',
    verifyToken,
    controller.getAll
);

router.get(
    '/:id',
    verifyToken,
    controller.getOne
);



router.put(
    '/:id',
    verifyToken,
    controller.update
);


module.exports = router;