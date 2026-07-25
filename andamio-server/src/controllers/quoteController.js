const Quote = require('../models/quoteModel');
const db = require('../config/db');


const createQuote = async (req, res) => {

    try {

        const tenantId = req.user.tenantId;

        const [lastQuote] = await db.query(
      'SELECT MAX(quote_folio) as lastFolio FROM quotes WHERE tenant_id = ?',
      [tenantId]
    );
    const nextFolio = (lastQuote.lastFolio || 0) + 1;

        const quoteData = {
            ...req.body,
            tenant_id: tenantId,
            quote_folio: nextFolio
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

const getQuoteById = async(req, res) => {
    try {
        const { id } = req.params;

        // 1. Guardamos el resultado de la base de datos en una variable temporal
        const result = await Quote.getById(id);

        // ✅ CAMBIO CLAVE: Si result es un arreglo [ { ... } ], tomamos solo el primer objeto { ... }
        // Si result ya es un objeto o es null, se queda igual.
        const quote = Array.isArray(result) ? result : result;

        // 2. Ahora la validación funcionará aunque la DB devuelva un arreglo vacío []
        if (!quote || (Array.isArray(result) && result.length === 0)) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        const items = await Quote.getItemsByQuote(id);

        res.json({
            success: true,
            data: {
                ...quote, // Ahora podemos esparcir las propiedades del objeto con seguridad
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

        const result = await Quote.getByEvaluationId(evaluationId);

        const quote = Array.isArray(result) ? result[0] : result;

        if (!quote || !quote.quote_id) {
            return res.json({
                success: true,
                data: {
                    items: []
                }
            });
        }

        const items = await Quote.getItemsByQuote(quote.quote_id);

        res.json({
            success: true,
            data: {
                ...quote,
                items
            }
        });

    } catch (error) {
        console.error('Error en getQuoteByEvaluationId:', error);
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