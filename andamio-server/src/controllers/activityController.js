const ActivityService = require('../services/activityService');

const getRecent = async (req, res) => {

    try {

        const tenantId = req.user.tenantId;
        const limit = Number(req.query.limit) || 6;

        const items = await ActivityService.getRecent(tenantId, limit);

        res.json({
            success: true,
            data: items
        });

    } catch (error) {

        console.error('Error en activityController.getRecent:', error);

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

};

module.exports = { getRecent };