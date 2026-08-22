const Quote = require('../models/quoteModel');

const VALID_STATUSES = ['borrador', 'enviada', 'aceptada', 'rechazada'];


const QuoteService = {

    // Crea una cotización nueva, calculando su folio y guardando sus items
    createQuote: async (tenantId, body) => {

        const nextFolio = await Quote.getNextFolio(tenantId);

        const quoteData = {
            ...body,
            tenant_id: tenantId,
            quote_folio: nextFolio
        };

        const quoteId = await Quote.create(quoteData);

        if (body.items && body.items.length > 0) {
            await Quote.createItems(quoteId, body.items);
        }

        return quoteId;
    },


    getQuotes: async (tenantId) => {
        return Quote.getAllByTenant(tenantId);
    },


    // Devuelve la cotización + sus items, o null si no existe (el controller decide el 404)
    getQuoteById: async (id, tenantId) => {

        const quote = await Quote.getById(id, tenantId);

        if (!quote) {
            return null;
        }

        const items = await Quote.getItemsByQuote(id);

        return { ...quote, items };
    },


    // Regla de negocio central: mientras está en 'borrador' se edita en sitio;
    // si ya fue enviada/aceptada/rechazada, se crea una versión nueva sin tocar la anterior.
    updateQuote: async (id, tenantId, body) => {

        const currentQuote = await Quote.getById(id, tenantId);

        if (!currentQuote) {
            return null;
        }

        const { items } = body;

        if (currentQuote.status === 'borrador') {

            await Quote.update(id, tenantId, body);
            await Quote.deleteItems(id);

            if (items && items.length > 0) {
                await Quote.createItems(id, items);
            }

            return {
                versioned: false,
                quoteId: Number(id)
            };
        }

        const newQuoteId = await Quote.createVersion(currentQuote, tenantId, body);

        await Quote.markNotCurrent(id, tenantId);

        if (items && items.length > 0) {
            await Quote.createItems(newQuoteId, items);
        }

        return {
            versioned: true,
            quoteId: newQuoteId,
            newVersionNumber: currentQuote.version_number + 1
        };
    },


    getQuoteByEvaluationId: async (evaluationId, tenantId) => {

        const result = await Quote.getByEvaluationId(evaluationId, tenantId);
        const quote = Array.isArray(result) ? result[0] : result;

        if (!quote || !quote.quote_id) {
            return { items: [] };
        }

        const items = await Quote.getItemsByQuote(quote.quote_id);

        return { ...quote, items };
    },


    // Lanza un error con code 'INVALID_STATUS' si el status no es válido;
    // el controller lo traduce a 400. Devuelve false si la cotización no existía (404).
    updateQuoteStatus: async (id, tenantId, status) => {

        if (!VALID_STATUSES.includes(status)) {
            const error = new Error(
                `Status inválido. Debe ser uno de: ${VALID_STATUSES.join(', ')}`
            );
            error.code = 'INVALID_STATUS';
            throw error;
        }

        const result = await Quote.updateStatus(id, tenantId, status);

        return result.affectedRows > 0;
    },


    getQuoteHistory: async (id, tenantId) => {
        return Quote.getVersionHistory(id, tenantId);
    },

    getStats: async (tenantId) => {

        const stats = await Quote.getStats(tenantId);

        return {
            total: Number(stats.total) || 0,
            borrador: Number(stats.borrador) || 0,
            enviada: Number(stats.enviada) || 0,
            aceptada: Number(stats.aceptada) || 0,
            rechazada: Number(stats.rechazada) || 0
        };
    },

};


module.exports = QuoteService;