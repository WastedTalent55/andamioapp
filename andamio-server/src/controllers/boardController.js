const Board = require('../models/boardModel');

const getSummary = async (req, res) => {

    try {

        const tenantId = req.user.tenantId;

        const data = await Board.getSummary(tenantId);

        const summary = {

            evaluations: data.filter(r => !r.quote_id),

            quoting: data.filter(
                r => r.quote_id && r.quote_status === 'borrador'
            ),

            active: data.filter(
                r => r.quote_status === 'aceptada'
            ),

            finished: data.filter(
                r => r.quote_status === 'finalizada'
            )

        };

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