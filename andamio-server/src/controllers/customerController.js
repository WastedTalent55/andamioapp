const Customer = require('../models/customerModel');

const getCustomers = async (req, res) => {
    try {
        const tenantId = 1; 
        const customers = await Customer.getAllByTenant(tenantId);
        
        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los clientes',
            error: error.message
        });
    }
};

module.exports = { getCustomers };