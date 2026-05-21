const db = require('../config/db');

const Customer = {
    getAllByTenant: async (tenantId) => {
        const [rows] = await db.query('SELECT * FROM customers WHERE tenant_id = ?', [tenantId]);
        return rows;
    }
};

module.exports = Customer;