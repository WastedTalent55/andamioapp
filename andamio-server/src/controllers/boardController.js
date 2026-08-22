const BoardService = require('../services/boardService');

const getSummary = async (req, res) => {

    try {

        const tenantId = req.user.tenantId;

        const summary = await BoardService.getSummary(tenantId);

        res.json({
            success: true,
            data: summary
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

};

module.exports = {
    getSummary
};