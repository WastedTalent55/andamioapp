const db = require('../config/db');

const Activity = {

    getRecentEvaluations: async (tenantId, limit) => {

        const [rows] = await db.query(
            `
            SELECT
                e.id,
                e.requested_work,
                e.created_at,
                CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name
            FROM evaluations e
            JOIN customers c ON e.customer_id = c.id
            WHERE e.tenant_id = ?
            ORDER BY e.created_at DESC
            LIMIT ?
            `,
            [tenantId, limit]
        );

        return rows;
    },

    getRecentQuotes: async (tenantId, limit) => {

        const [rows] = await db.query(
            `
            SELECT
                q.id,
                q.status,
                q.quote_folio,
                q.created_at,
                CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name
            FROM quotes q
            JOIN customers c ON q.customer_id = c.id
            WHERE q.tenant_id = ?
            AND q.is_current = 1
            ORDER BY q.created_at DESC
            LIMIT ?
            `,
            [tenantId, limit]
        );

        return rows;
    },

    getRecentProjects: async (tenantId, limit) => {

        const [rows] = await db.query(
            `
            SELECT
                p.id,
                p.project_name,
                p.created_at
            FROM projects p
            WHERE p.tenant_id = ?
            ORDER BY p.created_at DESC
            LIMIT ?
            `,
            [tenantId, limit]
        );

        return rows;
    }

};

module.exports = Activity;