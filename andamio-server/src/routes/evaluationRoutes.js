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
    '/without-quote',
    verifyToken,
    controller.getWithoutQuote
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

router.put(
    '/:id/details',
    verifyToken,
    controller.updateDetails
);

router.delete(
    '/:id',
    verifyToken,
    controller.remove
);


module.exports = router;