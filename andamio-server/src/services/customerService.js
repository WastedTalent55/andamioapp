const Customer = require('../models/customerModel');

const CustomerService = {

    createCustomer: async (tenantId, first_name, last_name, phone, addressData) => {
        return Customer.createWithAddress(tenantId, first_name, last_name, phone, addressData);
    },

    getCustomers: async (tenantId) => {
        return Customer.getAllByTenant(tenantId);
    },

    getCustomerById: async (id, tenantId) => {
        return Customer.getById(id, tenantId);
    },

    updateCustomer: async (id, tenantId, data) => {
        return Customer.update(id, tenantId, data);
    },

    // Regla de negocio: no se borra un cliente con evaluaciones/cotizaciones/proyectos
    // asociados — evita dejar esos registros huérfanos.
    deleteCustomer: async (id, tenantId) => {

        const hasDependents = await Customer.hasDependents(id, tenantId);

        if (hasDependents) {
            const error = new Error('Este cliente tiene evaluaciones, cotizaciones o proyectos asociados y no se puede eliminar.');
            error.code = 'CUSTOMER_HAS_DEPENDENTS';
            throw error;
        }

        return Customer.delete(id, tenantId);
    },

    getStats: async (tenantId) => {
        return Customer.getStats(tenantId);
    }

};

module.exports = CustomerService;