const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const projectController = require('../controllers/projectController');


// El proyecto siempre nace de una cotización aceptada
router.post(
    '/from-quote/:quoteId',
    verifyToken,
    projectController.createProjectFromQuote
);

router.get(
    '/',
    verifyToken,
    projectController.getProjects
);

router.get(
    '/count',
    verifyToken,
    projectController.getProjectStats
);

router.get(
    '/:id',
    verifyToken,
    projectController.getProjectById
);

router.put(
    '/:id',
    verifyToken,
    projectController.updateProject
);


module.exports = router;