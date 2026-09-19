const db = require('../config/db');


const Tenant = {
 

    update: async (id, tenantData) => {
        const {
            company_name,
            owner_name,
            email,
            phone,
            address,
            bank_name,
            bank_account,
            bank_clabe,
            terms_conditions,
            logo,
            brand_color,
            logo_shape,
            social_media
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
            terms_conditions = ?,
            logo = ?,
            brand_color = ?,
            logo_shape = ?,
            social_media = ?
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
            terms_conditions,
            logo,
            brand_color,
            logo_shape || 'square',
            social_media,
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