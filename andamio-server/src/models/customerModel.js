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

    createAddress: async (customerId, address) => {
        await db.query(
            `INSERT INTO customer_addresses
            (customer_id, address_label, full_address, is_primary)
            VALUES (?, ?, ?, ?)`,
            [
                customerId,
                'Principal',
                address,
                1
            ]
        );

    }
};
 
module.exports = Customer;