const Evaluation = require('../models/evaluationModel');

exports.create = async(req,res)=>{

    try {


        const evaluation = {

            tenant_id: req.user.tenantId,

            customer_id: req.body.customer_id,

            address_id: req.body.address_id,

            scheduled_date: req.body.scheduled_date,

            evaluation_cost: req.body.evaluation_cost || 0,

            requested_work: req.body.requested_work,

            requirements: req.body.requirements

        };



        const result = await Evaluation.createEvaluation(evaluation);



        res.json({

            success:true,

            id: result.insertId

        });



    } catch(error){

        console.error(error);

        res.status(500).json({

            success:false,

            message:'Error creando evaluación'

        });

    }

};

exports.getAll = async(req,res)=>{

    try {


        const data = await Evaluation.getEvaluations(
            req.user.tenantId
        );


        res.json({

            success:true,

            data

        });


    } catch(error){

        console.error(error);

        res.status(500).json({
            success:false
        });

    }

};

exports.getOne = async(req,res)=>{


    try {


        const evaluation = await Evaluation.getEvaluationById(
            req.params.id
        );


        if(!evaluation){

            return res.status(404).json({
                message:'Evaluación no encontrada'
            });

        }


        res.json(evaluation);


    }catch(error){

        res.status(500).json({
            error:error.message
        });

    }


};

exports.update = async(req,res)=>{
    try {
        const { requirements } = req.body;
        const evaluationId = req.params.id;

        // 1. Actualizamos las notas/requerimientos
        await Evaluation.updateRequirements(evaluationId, requirements);

        // 2. Lógica Automática: Si hay notas, el estatus pasa a 'realizada'
        if (requirements && requirements.trim() !== '') {
            await Evaluation.updateStatus(evaluationId, 'realizada');
        }

        res.json({ success: true, message: 'Evaluación actualizada y marcada como realizada' });
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCount = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        // 1. PASO DE SINCRONIZACIÓN: 
        // Antes de contar, pedimos al modelo que marque como 'cancelada' 
        // en la DB todo lo que ya pasó de fecha y no tiene notas.
        // (Debes crear este método en tu EvaluationModel)
        // await Evaluation.syncCancelledStatus(tenantId);

        // 2. LECTURA SIMPLE:
        // Ahora que la DB está al día, solo traemos los datos
        const evaluations = await Evaluation.getEvaluations(tenantId);

        // 3. CONTEO DIRECTO:
        // Ya no comparamos fechas aquí, solo leemos el campo 'status'
        const stats = {
            total: evaluations.length,
            pendiente: evaluations.filter(e => e.status === 'pendiente').length,
            realizada: evaluations.filter(e => e.status === 'realizada').length,
            cancelada: evaluations.filter(e => e.status === 'cancelada').length
        };

        res.json(stats);

    } catch (error) {
        console.error("Error en la infraestructura de datos:", error);
        res.status(500).json({ success: false });
    }
};