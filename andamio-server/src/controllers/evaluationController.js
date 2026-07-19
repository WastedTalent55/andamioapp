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


        await Evaluation.updateRequirements(
            req.params.id,
            req.body.requirements
        );


        res.json({

            success:true

        });


    }catch(error){


        res.status(500).json({
            error:error.message
        });


    }


};