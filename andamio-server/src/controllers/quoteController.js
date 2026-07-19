const Quote = require('../models/quoteModel');


const createQuote = async (req, res) => {

    try {

        const tenantId = req.user.tenantId;

        const quoteData = {
            ...req.body,
            tenant_id: tenantId
        };


        const quoteId = await Quote.create(quoteData);


        if (req.body.items && req.body.items.length > 0) {

            await Quote.createItems(
                quoteId,
                req.body.items
            );

        }


        res.json({
            success: true,
            message: 'Cotización creada correctamente',
            quoteId
        });


    } catch(error) {

        console.error('Error creando cotización:', error);

        res.status(500).json({
            success:false,
            message:'Error al crear cotización',
            error:error.message
        });

    }

};

const getQuotes = async (req,res)=>{

    try {

        const tenantId = req.user.tenantId;

        const quotes = await Quote.getAllByTenant(tenantId);


        res.json({
            success:true,
            data:quotes
        });


    } catch(error){

        res.status(500).json({
            success:false,
            error:error.message
        });

    }

};

const getQuoteById = async(req,res)=>{

    try {

        const { id } = req.params;


        const quote = await Quote.getById(id);


        if(!quote){
            return res.status(404).json({
                success:false,
                message:'Cotización no encontrada'
            });
        }


        const items = await Quote.getItemsByQuote(id);


        res.json({
            success:true,
            data:{
                ...quote,
                items
            }
        });


    } catch(error){

        res.status(500).json({
            success:false,
            error:error.message
        });

    }

};

const updateQuote = async(req,res)=>{

    try {

        const { id } = req.params;

        const {
            items
        } = req.body;


        await Quote.update(
            id,
            req.body
        );


        await Quote.deleteItems(id);


        if(items && items.length > 0){

            await Quote.createItems(
                id,
                items
            );

        }


        res.json({
            success:true,
            message:'Cotización actualizada correctamente'
        });


    } catch(error){

        console.error(
            'Error actualizando cotización:',
            error
        );


        res.status(500).json({
            success:false,
            error:error.message
        });

    }

};

const getQuoteByEvaluationId = async (req, res) => {

    try {

        const { evaluationId } = req.params;

        const quote = await Quote.getByEvaluationId(evaluationId);

        if (!quote || !quote.quote_id) {
            return res.json({
                success: true,
                data: {
                    items: []
                }
            });
        }

        const items = await Quote.getItemsByQuote(
            quote.quote_id
        );

        res.json({
            success: true,
            data: {
                ...quote,
                items
            }
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
    updateQuote    
};