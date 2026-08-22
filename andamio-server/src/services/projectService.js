const Project = require('../models/projectModel');
const QuoteService = require('./quoteService');

const ProjectService = {

    // El botón "Cotización aceptada" hace las dos cosas en un solo paso:
    // 1) crea el proyecto con la info que llenó el usuario en el formulario
    // 2) marca la cotización como 'aceptada' (reusa la validación de QuoteService)
    createProjectFromQuote: async (tenantId, quoteId, projectData) => {

        const quote = await QuoteService.getQuoteById(quoteId, tenantId);

        if (!quote) {
            const error = new Error('La cotización no existe');
            error.code = 'QUOTE_NOT_FOUND';
            throw error;
        }

        const existingProject = await Project.getByQuoteId(quoteId, tenantId);

        if (existingProject) {
            const error = new Error('Esta cotización ya tiene un proyecto asociado');
            error.code = 'PROJECT_ALREADY_EXISTS';
            throw error;
        }

        const projectId = await Project.create(tenantId, quoteId, quote.customer_id, projectData);

        // Si ya estaba en 'aceptada' (ej. se reintentó tras un error) no truena,
        // updateQuoteStatus solo valida que el status sea válido, no que cambie de valor
        await QuoteService.updateQuoteStatus(quoteId, tenantId, 'aceptada');

        return projectId;
    },

    getProjects: async (tenantId) => {
        return Project.getAllByTenant(tenantId);
    },

    getProjectById: async (id, tenantId) => {
        return Project.getById(id, tenantId);
    },

    updateProject: async (id, tenantId, data) => {
        return Project.update(id, tenantId, data);
    },

    getStats: async (tenantId) => {

        const stats = await Project.getStats(tenantId);

        return {
            total: Number(stats.total) || 0,
            activo: Number(stats.activo) || 0,
            pausado: Number(stats.pausado) || 0,
            finalizado: Number(stats.finalizado) || 0,
            cancelado: Number(stats.cancelado) || 0
        };
    }

};

module.exports = ProjectService;