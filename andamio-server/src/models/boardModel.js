const db = require('../config/db');

const Board = {

    getSummary: async (tenantId) => {

        const [rows] = await db.query(
            `
            SELECT
                e.id as eval_id,
                e.scheduled_date as eval_date,
                c.phone,
                e.requirements,
                CONCAT(c.first_name,' ',IFNULL(c.last_name,'')) as customer_name,
                ca.full_address as customer_address,
                q.id as quote_id,
                q.total_amount,
                q.status as quote_status,
                q.version_number
            FROM evaluations e
            JOIN customers c
                ON e.customer_id = c.id
            LEFT JOIN customer_addresses ca
                ON e.address_id = ca.id
            LEFT JOIN quotes q
                ON e.id = q.evaluation_id
            WHERE e.tenant_id = ?
            ORDER BY e.scheduled_date ASC
            `,
            [tenantId]
        );

        return rows;

    }

};

module.exports = Board;