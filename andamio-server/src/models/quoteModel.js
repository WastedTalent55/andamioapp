const db = require('../config/db');


const Quote = {

    create: async (data) => {

        const {
            tenant_id,
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
                evaluation_id,
                customer_id,
                delivery_time,
                evaluation_discount,
                total_amount,
                version_number,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'borrador')
            `,
            [
                tenant_id,
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


    getById: async (id) => {

    const [rows] = await db.query(
            `
            SELECT *
            FROM quotes
            WHERE id = ?
            `,
            [id]
        );

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

            ORDER BY q.id DESC
            `,
            [tenantId]
        );


        return rows;
    },

    update: async (id, data) => {

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
                total_amount = ?
            WHERE id = ?
            `,
            [
                delivery_time,
                evaluation_discount || 0,
                total_amount || 0,
                id
            ]
        );
        return result;
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

    getByEvaluationId: async (evaluationId) => {

        const [rows] = await db.query(
            `
            SELECT
                q.id AS quote_id,
                q.delivery_time,
                q.status,
                q.total_amount,
                q.evaluation_discount,
                e.requirements
            FROM evaluations e
            LEFT JOIN quotes q
                ON q.evaluation_id = e.id
            WHERE e.id = ?
            ORDER BY q.id DESC
            LIMIT 1
            `,
            [evaluationId]
        );

        return rows[0];
    },

};


module.exports = Quote;