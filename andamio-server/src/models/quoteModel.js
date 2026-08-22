const db = require('../config/db');


const Quote = {

    create: async (data) => {

        const {
            tenant_id,
            quote_folio,
            evaluation_id,
            customer_id,
            delivery_time,
            evaluation_discount,
            total_amount,
            version_number
        } = data;


        const [result] = await db.query(
            `
            INSERT INTO quotes
            (
                tenant_id,
                quote_folio,
                evaluation_id,
                customer_id,
                delivery_time,
                evaluation_discount,
                total_amount,
                version_number,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'borrador')
            `,
            [
                tenant_id,
                quote_folio,
                evaluation_id,
                customer_id,
                delivery_time,
                evaluation_discount || 0,
                total_amount || 0,
                version_number || 1
            ]
        );


        return result.insertId;
    },


    createItems: async (quoteId, items) => {

        if (!items || items.length === 0) {
            return;
        }


        const values = items.map(item => [
            quoteId,
            item.type,
            item.description,
            item.unit_price,
            item.quantity,
            item.unit,
            item.total_price
        ]);


        await db.query(
            `
            INSERT INTO quote_items
            (
                quote_id,
                type,
                description,
                unit_price,
                quantity,
                unit,
                total_price
            )
            VALUES ?
            `,
            [values]
        );

    },

    getItemsByQuote: async (quoteId) => {

        const [rows] = await db.query(
        `
            SELECT *
            FROM quote_items
            WHERE quote_id = ?
            `,
            [quoteId]
        );

        return rows;
    },

    getById: async (id, tenantId) => {
    const [rows] = await db.query(
        `
        SELECT
            q.id AS quote_id,  
            q.evaluation_id,    
            q.quote_folio,          
            q.version_number,       
            q.tenant_id,
            q.customer_id,
            q.delivery_time,
            q.total_amount,
            q.evaluation_discount,
            q.status,
            q.root_quote_id,
            q.is_current,
            q.created_at, 
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            c.phone,
            ca.full_address
        FROM quotes q
        -- 🛠️ CAMBIO: Usamos LEFT JOIN para que no se oculte la cotización si falta el cliente
        LEFT JOIN customers c
            ON q.customer_id = c.id
        -- Este ya estaba bien, pero asegúrate de que sea LEFT JOIN
        LEFT JOIN customer_addresses ca
            ON c.id = ca.customer_id
        WHERE q.id = ?
        AND q.tenant_id = ?;
        `,
        [id, tenantId]
    );
    // 🛠️ IMPORTANTE: rows es un array, devolvemos el primer elemento
    return rows[0]; 
},

    getAllByTenant: async (tenantId) => {

        const [rows] = await db.query(
            `
            SELECT 
                q.*,
                CONCAT(c.first_name,' ',c.last_name) AS customer_name

            FROM quotes q

            INNER JOIN customers c
            ON q.customer_id = c.id

            WHERE q.tenant_id = ?
            AND q.is_current = 1

            ORDER BY q.id DESC
            `,
            [tenantId]
        );


        return rows;
    },

    update: async (id, tenantId, data) => {

        const {
            delivery_time,
            evaluation_discount,
            total_amount
        } = data;


        const [result] = await db.query(
            `
            UPDATE quotes
            SET 
                delivery_time = ?,
                evaluation_discount = ?,
                total_amount = ?,
                version_number = version_number + 1
            WHERE id = ?
            AND tenant_id = ?
            `,
            [
                delivery_time,
                evaluation_discount || 0,
                total_amount || 0,
                id,
                tenantId
            ]
        );
        return result;
    },

    // 🆕 Marca una versión como no vigente (se usa al crear la siguiente versión)
    markNotCurrent: async (id, tenantId) => {

        await db.query(
            `
            UPDATE quotes
            SET is_current = 0
            WHERE id = ?
            AND tenant_id = ?
            `,
            [id, tenantId]
        );

    },

    // 🆕 Crea una fila NUEVA como siguiente versión de una cotización ya enviada/aceptada,
    // en vez de sobreescribir la existente. Preserva el folio y encadena root_quote_id.
    createVersion: async (previousQuote, tenantId, data) => {

        const {
            delivery_time,
            evaluation_discount,
            total_amount
        } = data;

        const rootQuoteId = previousQuote.root_quote_id || previousQuote.quote_id;

        const [result] = await db.query(
            `
            INSERT INTO quotes
            (
                tenant_id,
                quote_folio,
                evaluation_id,
                customer_id,
                delivery_time,
                evaluation_discount,
                total_amount,
                version_number,
                root_quote_id,
                is_current,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'borrador')
            `,
            [
                tenantId,
                previousQuote.quote_folio,
                previousQuote.evaluation_id,
                previousQuote.customer_id,
                delivery_time,
                evaluation_discount || 0,
                total_amount || 0,
                previousQuote.version_number + 1,
                rootQuoteId
            ]
        );

        return result.insertId;
    },

    // 🆕 Devuelve todas las versiones (histórico + vigente) de una misma cotización,
    // ordenadas de la más reciente a la más antigua
    getVersionHistory: async (quoteId, tenantId) => {

        const current = await db.query(
            `SELECT root_quote_id FROM quotes WHERE id = ? AND tenant_id = ?`,
            [quoteId, tenantId]
        );

        const rootId = current[0][0]?.root_quote_id || quoteId;

        const [rows] = await db.query(
            `
            SELECT
                id AS quote_id,
                version_number,
                status,
                total_amount,
                is_current,
                created_at
            FROM quotes
            WHERE tenant_id = ?
            AND (id = ? OR root_quote_id = ?)
            ORDER BY version_number DESC
            `,
            [tenantId, rootId, rootId]
        );

        return rows;
    },


    deleteItems: async (quoteId) => {

        await db.query(
            `
            DELETE FROM quote_items
            WHERE quote_id = ?
            `,
            [quoteId]
        );

    },

    // 🆕 Cambia el status de una cotización (borrador -> enviada -> aceptada/rechazada).
    // Es lo que dispara, en el controller, la decisión de crear una versión nueva en la próxima edición.
    updateStatus: async (id, tenantId, status) => {

        const [result] = await db.query(
            `
            UPDATE quotes
            SET status = ?
            WHERE id = ?
            AND tenant_id = ?
            `,
            [status, id, tenantId]
        );

        return result;
    },

    getByEvaluationId: async (evaluationId, tenantId) => {

        const [rows] = await db.query(
            `
            SELECT
                q.id AS quote_id,
                q.quote_folio,       
                q.version_number, 
                q.delivery_time,
                q.status,
                q.total_amount,
                q.evaluation_discount,
                e.requirements
            FROM evaluations e
            LEFT JOIN quotes q
                ON q.evaluation_id = e.id
                AND q.is_current = 1
            WHERE e.id = ?
            AND e.tenant_id = ?
            ORDER BY q.id DESC
            LIMIT 1
            `,
            [evaluationId, tenantId]
        );

        return rows[0];
    },

    // 🆕 Devuelve el siguiente folio disponible para el tenant (pura consulta, sin lógica de negocio)
    getNextFolio: async (tenantId) => {

        const [rows] = await db.query(
            'SELECT MAX(quote_folio) as lastFolio FROM quotes WHERE tenant_id = ?',
            [tenantId]
        );

        return (rows[0].lastFolio || 0) + 1;
    },

    // 🆕 Conteo agregado en SQL para el dashboard. Solo cuenta versiones vigentes
    // (is_current = 1) — igual que getAllByTenant, para no inflar el total con
    // versiones viejas de una misma cotización.
    getStats: async (tenantId) => {

        const [rows] = await db.query(
            `
            SELECT
                COUNT(*) AS total,
                SUM(status = 'borrador') AS borrador,
                SUM(status = 'enviada') AS enviada,
                SUM(status = 'aceptada') AS aceptada,
                SUM(status = 'rechazada') AS rechazada
            FROM quotes
            WHERE tenant_id = ?
            AND is_current = 1
            `,
            [tenantId]
        );

        return rows[0];
    },

};




module.exports = Quote;