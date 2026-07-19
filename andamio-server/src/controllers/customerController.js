const Customer = require('../models/customerModel');

const getCustomers = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
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

const createCustomer = async (req, res) => {
    try {

        const { first_name, last_name, phone, address } = req.body;
        const tenantId = req.user.tenantId;

        const customerId = await Customer.create(
            tenantId,
            first_name,
            last_name,
            phone
        );

        await Customer.createAddress(
            customerId,
            address
        );

        res.json({
            success: true,
            message: 'Cliente y dirección registrados con éxito',
            id: customerId
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Error al crear el cliente',
            error: error.message
        });

    }
};


module.exports = { 
    getCustomers,
    createCustomer
};