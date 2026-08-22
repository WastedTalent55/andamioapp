const EvaluationService = require('../services/evaluationService');


exports.create = async (req, res) => {

    try {

        const tenantId = req.user.tenantId;

        const id = await EvaluationService.createEvaluation(tenantId, req.body);

        res.json({
            success: true,
            message: 'Evaluación creada correctamente',
            data: { id }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Error creando evaluación'
        });

    }

};


exports.getAll = async (req, res) => {

    try {

        const data = await EvaluationService.getEvaluations(req.user.tenantId);

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false
        });

    }

};


exports.getOne = async (req, res) => {

    try {

        const evaluation = await EvaluationService.getEvaluationById(
            req.params.id,
            req.user.tenantId
        );

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Evaluación no encontrada'
            });
        }

        // 🛠️ Antes regresaba el objeto evaluación directo (sin wrapper),
        // inconsistente con el resto de la API. Ahora sigue el mismo shape.
        res.json({
            success: true,
            data: evaluation
        });

    } catch (error) {

        console.error('❌ Error en evaluationController.getOne:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


exports.update = async (req, res) => {

    try {

        const { requirements } = req.body;
        const evaluationId = req.params.id;
        const tenantId = req.user.tenantId;

        const updated = await EvaluationService.updateEvaluation(evaluationId, tenantId, requirements);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Evaluación no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Evaluación actualizada y marcada como realizada'
        });

    } catch (error) {

        console.error('❌ Error en evaluationController.update:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


exports.getCount = async (req, res) => {

    try {

        const stats = await EvaluationService.getStats(req.user.tenantId);

        // 🛠️ Antes regresaba el objeto de stats directo (sin wrapper) y calculaba
        // los conteos en JS trayendo TODAS las evaluaciones del tenant a memoria.
        // Ahora es un COUNT/GROUP BY en SQL, y respeta {success, data}.
        res.json({
            success: true,
            data: stats
        });

    } catch (error) {

        console.error("Error en la infraestructura de datos:", error);

        res.status(500).json({
            success: false
        });

    }

};


// Edición completa (agenda/costo/trabajo solicitado) — distinta de update()
// de arriba, que solo guarda las notas de la visita
exports.updateDetails = async (req, res) => {

    try {

        const evaluationId = req.params.id;
        const tenantId = req.user.tenantId;

        const updated = await EvaluationService.updateEvaluationDetails(evaluationId, tenantId, req.body);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Evaluación no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Evaluación actualizada correctamente'
        });

    } catch (error) {

        console.error('❌ Error en evaluationController.updateDetails:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


exports.remove = async (req, res) => {

    try {

        const evaluationId = req.params.id;
        const tenantId = req.user.tenantId;

        const deleted = await EvaluationService.deleteEvaluation(evaluationId, tenantId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Evaluación no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Evaluación eliminada correctamente'
        });

    } catch (error) {

        if (error.code === 'EVALUATION_HAS_QUOTE') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        console.error('❌ Error en evaluationController.remove:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};