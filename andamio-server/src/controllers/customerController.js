const CustomerService = require('../services/customerService');

const getCount = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        const stats = await CustomerService.getStats(tenantId);

        res.json({
            success: true,
            data: {
                total: stats.total,
                newThisMonth: stats.newThisMonth
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas de clientes'
        });
    }
};

const getCustomers = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const customers = await CustomerService.getCustomers(tenantId);

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

const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const customer = await CustomerService.getCustomerById(id, tenantId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const createCustomer = async (req, res) => {
    try {

        const {
            first_name,
            last_name,
            phone,
            address,
            place_id,
            latitude,
            longitude,
            city,
            state,
            postal_code,
            country
        } = req.body;

        const tenantId = req.user.tenantId;

        const customerId = await CustomerService.createCustomer(
            tenantId,
            first_name,
            last_name,
            phone,
            {
                full_address: address,
                place_id: place_id || null,
                latitude: latitude || null,
                longitude: longitude || null,
                city: city || null,
                state: state || null,
                postal_code: postal_code || null,
                country: country || null
            }
        );

        res.json({
            success: true,
            message: 'Cliente y dirección registrados con éxito',
            data: { id: customerId }
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Error al crear el cliente',
            error: error.message
        });

    }
};

const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const updated = await CustomerService.updateCustomer(id, tenantId, req.body);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Cliente actualizado correctamente'
        });

    } catch (error) {
        console.error('Error actualizando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el cliente',
            error: error.message
        });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const deleted = await CustomerService.deleteCustomer(id, tenantId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Cliente eliminado correctamente'
        });

    } catch (error) {

        if (error.code === 'CUSTOMER_HAS_DEPENDENTS') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        console.error('Error eliminando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el cliente',
            error: error.message
        });
    }
};

module.exports = {
    getCount,
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};