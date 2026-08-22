const db = require('../config/db');

const Project = {

    // Regla de negocio (UNIQUE KEY en la tabla) impide duplicados; esto es solo
    // para poder darle al usuario un mensaje claro antes de que la BD truene
    getByQuoteId: async (quoteId, tenantId) => {

        const [rows] = await db.query(
            'SELECT * FROM projects WHERE quote_id = ? AND tenant_id = ?',
            [quoteId, tenantId]
        );

        return rows[0] || null;
    },

    create: async (tenantId, quoteId, customerId, data) => {

        const [result] = await db.query(
            `INSERT INTO projects
                (tenant_id, quote_id, customer_id, project_name, start_date, estimated_end_date, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
            [
                tenantId,
                quoteId,
                customerId,
                data.project_name,
                data.start_date || null,
                data.estimated_end_date || null,
                data.notes || null
            ]
        );

        return result.insertId;
    },

    getAllByTenant: async (tenantId) => {

        const [rows] = await db.query(
            `
            SELECT
                p.*,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                c.phone,
                ca.full_address,
                q.quote_folio,
                q.total_amount

            FROM projects p
            INNER JOIN customers c ON p.customer_id = c.id
            LEFT JOIN customer_addresses ca ON c.id = ca.customer_id
            INNER JOIN quotes q ON p.quote_id = q.id

            WHERE p.tenant_id = ?
            ORDER BY p.created_at DESC
            `,
            [tenantId]
        );

        return rows;
    },

    getById: async (id, tenantId) => {

        const [rows] = await db.query(
            `
            SELECT
                p.*,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                c.phone,
                ca.full_address,
                q.quote_folio,
                q.total_amount

            FROM projects p
            INNER JOIN customers c ON p.customer_id = c.id
            LEFT JOIN customer_addresses ca ON c.id = ca.customer_id
            INNER JOIN quotes q ON p.quote_id = q.id

            WHERE p.id = ? AND p.tenant_id = ?
            `,
            [id, tenantId]
        );

        return rows[0] || null;
    },

    update: async (id, tenantId, data) => {

        const [result] = await db.query(
            `UPDATE projects
             SET project_name = ?,
                 start_date = ?,
                 estimated_end_date = ?,
                 status = ?,
                 notes = ?
             WHERE id = ? AND tenant_id = ?`,
            [
                data.project_name,
                data.start_date || null,
                data.estimated_end_date || null,
                data.status,
                data.notes || null,
                id,
                tenantId
            ]
        );

        return result.affectedRows > 0;
    },

    // 🆕 Conteo agregado en SQL para el dashboard
    getStats: async (tenantId) => {

        const [rows] = await db.query(
            `
            SELECT
                COUNT(*) AS total,
                SUM(status = 'activo') AS activo,
                SUM(status = 'pausado') AS pausado,
                SUM(status = 'finalizado') AS finalizado,
                SUM(status = 'cancelado') AS cancelado
            FROM projects
            WHERE tenant_id = ?
            `,
            [tenantId]
        );

        return rows[0];
    }

};

module.exports = Project;