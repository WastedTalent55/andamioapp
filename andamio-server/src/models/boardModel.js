const db = require('../config/db');

const Board = {

    getSummary: async (tenantId) => {

        const [rows] = await db.query(
            `
            SELECT * FROM (

                SELECT
                    e.requested_work,
                    q.created_at,
                    e.id as eval_id,
                    e.scheduled_date as eval_date,
                    c.phone,
                    e.requirements,

                    CASE

                        WHEN e.scheduled_date > NOW()
                        THEN 'pendiente'


                        WHEN e.scheduled_date <= NOW()
                             AND e.requirements IS NOT NULL
                             AND e.requirements <> ''
                        THEN 'realizada'


                        WHEN e.scheduled_date <= NOW()
                             AND (e.requirements IS NULL OR e.requirements = '')
                        THEN 'cancelada'


                    END AS evaluation_status,

                    CONCAT(c.first_name,' ',IFNULL(c.last_name,'')) as customer_name,
                    ca.full_address as customer_address,
                    q.id as quote_id,
                    q.total_amount,
                    q.status as quote_status,
                    q.version_number,

                    -- 🆕 Datos del proyecto (si la cotización ya fue aceptada y tiene uno)
                    p.id as project_id,
                    p.project_name,
                    p.status as project_status,
                    p.start_date as project_start_date

                FROM evaluations e
                JOIN customers c
                    ON e.customer_id = c.id
                LEFT JOIN customer_addresses ca
                    ON e.address_id = ca.id
                LEFT JOIN quotes q
                    ON e.id = q.evaluation_id
                    AND q.is_current = 1
                LEFT JOIN projects p
                    ON p.quote_id = q.id
                WHERE e.tenant_id = ?

                UNION ALL

                -- Cotizaciones directas (sin evaluación): mismas columnas, sin datos de evaluación
                SELECT
                    NULL as requested_work,
                    q.created_at,
                    NULL as eval_id,
                    NULL as eval_date,
                    c.phone,
                    NULL as requirements,
                    NULL as evaluation_status,
                    CONCAT(c.first_name,' ',IFNULL(c.last_name,'')) as customer_name,
                    ca.full_address as customer_address,
                    q.id as quote_id,
                    q.total_amount,
                    q.status as quote_status,
                    q.version_number,

                    p.id as project_id,
                    p.project_name,
                    p.status as project_status,
                    p.start_date as project_start_date

                FROM quotes q
                JOIN customers c
                    ON q.customer_id = c.id
                LEFT JOIN customer_addresses ca
                    ON c.id = ca.customer_id
                LEFT JOIN projects p
                    ON p.quote_id = q.id
                WHERE q.tenant_id = ?
                AND q.evaluation_id IS NULL
                AND q.is_current = 1

            ) board_rows
            ORDER BY eval_date ASC, created_at ASC
            `,
            [tenantId, tenantId]
        );

        return rows;

    }

};

module.exports = Board;