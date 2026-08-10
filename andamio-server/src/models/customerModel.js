const db = require('../config/db');

const Customer = {
    getAllByTenant: async (tenantId) => {
        const [rows] = await db.query('SELECT c.*, ca.id AS address_id, ca.full_address FROM customers c LEFT JOIN customer_addresses ca ON c.id = ca.customer_id WHERE c.tenant_id = ?', [tenantId]);
        return rows;
    },

    create: async (tenantId, first_name, last_name, phone) => {
        const [result] = await db.query(
            `INSERT INTO customers
            (tenant_id, first_name, last_name, phone)
            VALUES (?, ?, ?, ?)`,
            [tenantId, first_name, last_name, phone]
        );

        return result.insertId;
    },

    createAddress: async (customerId, addressData) => {
        await db.query(
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
            is_primary,
            created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    },

    getCount: async (tenantId) => {

        const [rows] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM customers
            WHERE tenant_id = ?
            `,
            [tenantId]
        );

        return rows[0].total;
    }

};
 
module.exports = Customer;