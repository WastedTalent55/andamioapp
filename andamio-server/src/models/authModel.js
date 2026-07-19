const db = require('../config/db');

const Auth = {

    findUserByGoogleId: async (googleId) => {

        const [rows] = await db.query(
            `
            SELECT *
            FROM users
            WHERE google_id = ?
            `,
            [googleId]
        );

        return rows[0];
    },

    createTenant: async (companyName, email) => {

        const [result] = await db.query(
            `
            INSERT INTO tenants
            (
                company_name,
                email
            )
            VALUES (?, ?)
            `,
            [companyName, email]
        );

        return result.insertId;
    },

    createUser: async (data) => {

        const {
            tenant_id,
            google_id,
            name,
            email,
            picture_url
        } = data;

        const [result] = await db.query(
            `
            INSERT INTO users
            (
                tenant_id,
                google_id,
                name,
                email,
                picture_url,
                role
            )
            VALUES (?, ?, ?, ?, ?, 'admin')
            `,
            [
                tenant_id,
                google_id,
                name,
                email,
                picture_url
            ]
        );

        return result.insertId;
    }

};

module.exports = Auth;