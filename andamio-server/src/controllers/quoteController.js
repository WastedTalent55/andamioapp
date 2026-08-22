const QuoteService = require('../services/quoteService');


const createQuote = async (req, res) => {

    try {

        const tenantId = req.user.tenantId;

        const quoteId = await QuoteService.createQuote(tenantId, req.body);

        res.json({
            success: true,
            message: 'Cotización creada correctamente',
            quoteId
        });

    } catch (error) {

        console.error('Error creando cotización:', error);

        res.status(500).json({
            success: false,
            message: 'Error al crear cotización',
            error: error.message
        });

    }

};

const getQuotes = async (req, res) => {

    try {

        const tenantId = req.user.tenantId;

        const quotes = await QuoteService.getQuotes(tenantId);

        res.json({
            success: true,
            data: quotes
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

};

const getQuoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const quote = await QuoteService.getQuoteById(id, tenantId);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        res.json({
            success: true,
            data: quote
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const updateQuote = async (req, res) => {

    try {

        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const result = await QuoteService.updateQuote(id, tenantId, req.body);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        if (!result.versioned) {
            return res.json({
                success: true,
                message: 'Cotización actualizada correctamente',
                versioned: false,
                quoteId: result.quoteId
            });
        }

        res.json({
            success: true,
            message: `Se creó la versión ${result.newVersionNumber} de la cotización`,
            versioned: true,
            quoteId: result.quoteId
        });

    } catch (error) {

        console.error('Error actualizando cotización:', error);

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

};

const getQuoteByEvaluationId = async (req, res) => {
    try {
        const { evaluationId } = req.params;
        const tenantId = req.user.tenantId;

        const quote = await QuoteService.getQuoteByEvaluationId(evaluationId, tenantId);

        res.json({
            success: true,
            data: quote
        });

    } catch (error) {
        console.error('Error en getQuoteByEvaluationId:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const updateQuoteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const tenantId = req.user.tenantId;

        const updated = await QuoteService.updateQuoteStatus(id, tenantId, status);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        res.json({
            success: true,
            message: `Cotización marcada como ${status}`
        });

    } catch (error) {

        if (error.code === 'INVALID_STATUS') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getQuoteHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const history = await QuoteService.getQuoteHistory(id, tenantId);

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getQuoteStats = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        const stats = await QuoteService.getStats(tenantId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    createQuote,
    getQuotes,
    getQuoteById,
    getQuoteByEvaluationId,
    getQuoteHistory,
    getQuoteStats,
    updateQuote,
    updateQuoteStatus
};