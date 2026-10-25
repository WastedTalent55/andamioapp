const Quote = require('../models/quoteModel');
const db = require('../config/db');

// Count Unicode code points, matching the frontend (including emoji).
function specialConditions(body, previous = null) {
    if (!Object.prototype.hasOwnProperty.call(body, 'special_conditions')) return previous ?? null;
    const value = body.special_conditions;
    if (value !== null && (typeof value !== 'string' || Array.from(value).length > 5000)) {
        const error = new Error('Las condiciones particulares deben ser texto de hasta 5.000 caracteres o null.');
        error.code = 'INVALID_SPECIAL_CONDITIONS';
        throw error;
    }
    return value === null || !value.trim() ? null : value;
}

function downPaymentPercent(body, previous = 50) {
    if (!Object.prototype.hasOwnProperty.call(body, 'down_payment_percent')) return Number(previous ?? 50);
    const value = body.down_payment_percent;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100) {
        const error = new Error('El porcentaje de anticipo debe ser un número entero entre 0 y 100.');
        error.code = 'INVALID_DOWN_PAYMENT_PERCENT';
        throw error;
    }
    return value;
}

// One pooled connection owns all reads and writes of a save operation.
async function inTransaction(save) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const result = await save(connection);
        await connection.commit();
        return result;
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            // Do not put an uncertain session back into the pool.
            error.cause = rollbackError;
            connection.destroy();
        }
        throw error;
    } finally {
        connection.release();
    }
}

const VALID_STATUSES = ['borrador', 'enviada', 'aceptada', 'rechazada'];


const QuoteService = {

    // Crea una cotización nueva, calculando su folio y guardando sus items
    createQuote: async (tenantId, body) => {

        const conditions = specialConditions(body);
        const depositPercent = downPaymentPercent(body);
        return inTransaction(async connection => {
            await Quote.lockTenant(tenantId, connection);
            const nextFolio = await Quote.getNextFolio(tenantId, connection);
            const quoteData = {
                ...body,
                tenant_id: tenantId,
                quote_folio: nextFolio,
                special_conditions: conditions,
                down_payment_percent: depositPercent
            };
            const quoteId = await Quote.create(quoteData, connection);
            if (body.items && body.items.length > 0) {
                await Quote.createItems(quoteId, body.items, connection);
            }
            return quoteId;
        });
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

        // Validate before any writes, including when the field is omitted.
        specialConditions(body);
        downPaymentPercent(body);
        return inTransaction(async connection => {
            const currentQuote = await Quote.getForUpdate(id, tenantId, connection);
            if (!currentQuote) return null;
            if (Number(currentQuote.is_current) !== 1) {
                const error = new Error('La versión de origen ya no está vigente.');
                error.code = 'STALE_QUOTE_VERSION';
                throw error;
            }

            const data = {
                ...body,
                special_conditions: specialConditions(body, currentQuote.special_conditions),
                down_payment_percent: downPaymentPercent(body, currentQuote.down_payment_percent)
            };
            const { items } = body;
            if (currentQuote.status === 'borrador') {
                await Quote.update(id, tenantId, data, connection);
                await Quote.deleteItems(id, connection);
                if (items && items.length > 0) {
                    await Quote.createItems(id, items, connection);
                }
                return { versioned: false, quoteId: Number(id) };
            }

            const newQuoteId = await Quote.createVersion(currentQuote, tenantId, data, connection);
            await Quote.markNotCurrent(id, tenantId, connection);
            if (items && items.length > 0) {
                await Quote.createItems(newQuoteId, items, connection);
            }
            return {
                versioned: true,
                quoteId: newQuoteId,
                newVersionNumber: currentQuote.version_number + 1
            };
        });
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
