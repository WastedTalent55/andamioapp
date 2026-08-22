const db = require('../config/db');

const Customer = {
    getAllByTenant: async (tenantId) => {
        const [rows] = await db.query('SELECT c.*, ca.id AS address_id, ca.full_address FROM customers c LEFT JOIN customer_addresses ca ON c.id = ca.customer_id WHERE c.tenant_id = ?', [tenantId]);
        return rows;
    },

    // 🆕 create() y createAddress() ahora corren en una sola transacción:
    // si el INSERT de la dirección falla, el cliente tampoco se guarda.
    // Antes quedaban clientes huérfanos sin dirección cada vez que createAddress tronaba.
    createWithAddress: async (tenantId, first_name, last_name, phone, addressData) => {

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [customerResult] = await connection.query(
                `INSERT INTO customers
                (tenant_id, first_name, last_name, phone)
                VALUES (?, ?, ?, ?)`,
                [tenantId, first_name, last_name, phone]
            );

            const customerId = customerResult.insertId;

            await connection.query(
                `
                INSERT INTO customer_addresses
                (
                customer_id,
                address_label,
                full_address,
                place_id,
                latitude,
                longitude,
                city,
                state,
                postal_code,
                country,
                is_primary
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    customerId,
                    'Principal',
                    addressData.full_address,
                    addressData.place_id,
                    addressData.latitude,
                    addressData.longitude,
                    addressData.city,
                    addressData.state,
                    addressData.postal_code,
                    addressData.country,
                    1
                ]
            );

            await connection.commit();

            return customerId;

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    },

    getStats: async (tenantId) => {
        const query = `
            SELECT 
                COUNT(*) AS total,
                COUNT(CASE 
                    WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) 
                    AND YEAR(created_at) = YEAR(CURRENT_DATE()) 
                    THEN 1 
                END) AS newThisMonth
            FROM customers
            WHERE tenant_id = ?
        `;

        const [rows] = await db.query(query, [tenantId]);
        
        // 🐛 FIX: antes regresaba `rows` (el arreglo completo) en vez de `rows[0]`
        // (la fila con los números) — el controller leía stats.total sobre un
        // array, que siempre daba undefined.
        return rows[0];
    },

    // Si quieres mantener el getCount simple para otros usos, puedes dejarlo así:
    getCount: async (tenantId) => {
        const [rows] = await db.query(
            'SELECT COUNT(*) AS total FROM customers WHERE tenant_id = ?',
            [tenantId]
        );
        return rows.total;
    },

    getById: async (id, tenantId) => {
        const [rows] = await db.query(
            `SELECT c.*, ca.id AS address_id, ca.full_address, ca.place_id, ca.latitude,
                    ca.longitude, ca.city, ca.state, ca.postal_code, ca.country
             FROM customers c
             LEFT JOIN customer_addresses ca ON c.id = ca.customer_id
             WHERE c.id = ? AND c.tenant_id = ?`,
            [id, tenantId]
        );
        return rows[0] || null;
    },

    // Antes de borrar, checamos si el cliente tiene evaluaciones/cotizaciones/proyectos
    // asociados — sin esto, un borrado dejaría esos registros huérfanos (o tronaría
    // a medias si alguna tabla sí tiene FK constraint y otra no).
    hasDependents: async (customerId, tenantId) => {
        const [[evalRows], [quoteRows], [projectRows]] = await Promise.all([
            db.query('SELECT COUNT(*) AS count FROM evaluations WHERE customer_id = ? AND tenant_id = ?', [customerId, tenantId]),
            db.query('SELECT COUNT(*) AS count FROM quotes WHERE customer_id = ? AND tenant_id = ?', [customerId, tenantId]),
            db.query('SELECT COUNT(*) AS count FROM projects WHERE customer_id = ? AND tenant_id = ?', [customerId, tenantId])
        ]);

        return (evalRows[0].count + quoteRows[0].count + projectRows[0].count) > 0;
    },

    update: async (id, tenantId, data) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `UPDATE customers SET first_name = ?, last_name = ?, phone = ?
                 WHERE id = ? AND tenant_id = ?`,
                [data.first_name, data.last_name, data.phone, id, tenantId]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return false;
            }

            // upsert de la dirección: si ya existía una fila la actualiza, si no la crea
            const [existing] = await connection.query(
                'SELECT id FROM customer_addresses WHERE customer_id = ? LIMIT 1',
                [id]
            );

            if (existing.length > 0) {
                await connection.query(
                    `UPDATE customer_addresses
                     SET full_address = ?, place_id = ?, latitude = ?, longitude = ?,
                         city = ?, state = ?, postal_code = ?, country = ?
                     WHERE customer_id = ?`,
                    [
                        data.address, data.place_id || null, data.latitude || null, data.longitude || null,
                        data.city || null, data.state || null, data.postal_code || null, data.country || null,
                        id
                    ]
                );
            } else {
                await connection.query(
                    `INSERT INTO customer_addresses
                     (customer_id, address_label, full_address, place_id, latitude, longitude, city, state, postal_code, country, is_primary)
                     VALUES (?, 'Principal', ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [
                        id, data.address, data.place_id || null, data.latitude || null, data.longitude || null,
                        data.city || null, data.state || null, data.postal_code || null, data.country || null
                    ]
                );
            }

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    },

    delete: async (id, tenantId) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            await connection.query('DELETE FROM customer_addresses WHERE customer_id = ?', [id]);

            const [result] = await connection.query(
                'DELETE FROM customers WHERE id = ? AND tenant_id = ?',
                [id, tenantId]
            );

            await connection.commit();
            return result.affectedRows > 0;

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    }
};
 
module.exports = Customer;