const Evaluation = require('../models/evaluationModel');


const EvaluationService = {

    createEvaluation: async (tenantId, body) => {

        const evaluation = {
            tenant_id: tenantId,
            customer_id: body.customer_id,
            address_id: body.address_id,
            scheduled_date: body.scheduled_date,
            evaluation_cost: body.evaluation_cost || 0,
            requested_work: body.requested_work,
            requirements: body.requirements
        };

        const result = await Evaluation.createEvaluation(evaluation);

        return result.insertId;
    },


    getEvaluations: async (tenantId) => {
        return Evaluation.getEvaluations(tenantId);
    },


    getEvaluationById: async (id, tenantId) => {
        return Evaluation.getEvaluationById(id, tenantId);
    },


    // Regla de negocio: si se guardan notas/requerimientos, la evaluación
    // pasa automáticamente a 'realizada'. Devuelve false si no existía (404).
    updateEvaluation: async (id, tenantId, requirements) => {

        const result = await Evaluation.updateRequirements(id, tenantId, requirements);

        if (result.affectedRows === 0) {
            return false;
        }

        if (requirements && requirements.trim() !== '') {
            await Evaluation.updateStatus(id, tenantId, 'realizada');
        }

        return true;
    },


    // Sincroniza vencidas -> canceladas antes de contar, para que el dashboard
    // nunca muestre "pendientes" que ya vencieron sin notas.
    getStats: async (tenantId) => {
        await Evaluation.syncCancelledStatus(tenantId);
        return Evaluation.getStats(tenantId);
    },

};


module.exports = EvaluationService;