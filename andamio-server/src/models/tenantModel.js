const db = require('../config/db');


const Tenant = {


    update: async (id, tenantData) => {
    console.log("Datos recibidos en el modelo:", { ...tenantData, logo: tenantData.logo ? 'Imagen detectada' : 'VACÍO' });

        const {
            company_name,
            owner_name,
            email,
            phone,
            address,
            bank_name,
            bank_account,
            bank_clabe,
            logo
        } = tenantData;


        const query = `
            UPDATE tenants SET 
            company_name = ?, 
            owner_name = ?, 
            email = ?, 
            phone = ?, 
            address = ?, 
            bank_name = ?, 
            bank_account = ?, 
            bank_clabe = ?, 
            logo = ?
            WHERE id = ?
        `;


        const [result] = await db.query(query, [
            company_name,
            owner_name,
            email,
            phone,
            address,
            bank_name,
            bank_account,
            bank_clabe,
            logo,
            id
        ]);


        return result;

    },



    getById: async(id)=>{


        const query = `
            SELECT *
            FROM tenants
            WHERE id = ?
        `;


        const [rows] = await db.query(query,[id]);


        return rows;

    }


};


module.exports = Tenant;