const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const quoteController = require('../controllers/quoteController');


router.post(
    '/',
    verifyToken,
    quoteController.createQuote
);


router.get(
    '/',
    verifyToken,
    quoteController.getQuotes
);

router.get(
    '/count',
    verifyToken,
    quoteController.getQuoteStats
);

router.get(
    '/evaluation/:evaluationId',
    verifyToken,
    quoteController.getQuoteByEvaluationId
);

router.patch(
    '/:id/status',
    verifyToken,
    quoteController.updateQuoteStatus
);

router.get(
    '/:id/history',
    verifyToken,
    quoteController.getQuoteHistory
);

router.get(
    '/:id',
    verifyToken,
    quoteController.getQuoteById
);

router.put(
    '/:id',
    verifyToken,
    quoteController.updateQuote
);



module.exports = router;