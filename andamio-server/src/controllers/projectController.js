const ProjectService = require('../services/projectService');


const createProjectFromQuote = async (req, res) => {

    try {

        const tenantId = req.user.tenantId;
        const { quoteId } = req.params;

        const projectId = await ProjectService.createProjectFromQuote(tenantId, quoteId, req.body);

        res.json({
            success: true,
            message: 'Proyecto creado correctamente',
            data: { projectId }
        });

    } catch (error) {

        if (error.code === 'QUOTE_NOT_FOUND') {
            return res.status(404).json({ success: false, message: error.message });
        }

        if (error.code === 'PROJECT_ALREADY_EXISTS') {
            return res.status(409).json({ success: false, message: error.message });
        }

        console.error('Error creando proyecto:', error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }

};

const getProjects = async (req, res) => {

    try {

        const tenantId = req.user.tenantId;
        const projects = await ProjectService.getProjects(tenantId);

        res.json({
            success: true,
            data: projects
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }

};

const getProjectById = async (req, res) => {

    try {

        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const project = await ProjectService.getProjectById(id, tenantId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        res.json({
            success: true,
            data: project
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }

};

const updateProject = async (req, res) => {

    try {

        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const updated = await ProjectService.updateProject(id, tenantId, req.body);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Proyecto actualizado correctamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }

};

const getProjectStats = async (req, res) => {

    try {

        const tenantId = req.user.tenantId;
        const stats = await ProjectService.getStats(tenantId);

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
    createProjectFromQuote,
    getProjects,
    getProjectById,
    getProjectStats,
    updateProject
};