const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const Auth = require('../models/authModel');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {

    try {

        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        const {
            sub: google_id,
            email,
            name,
            picture
        } = payload;

        let user = await Auth.findUserByGoogleId(google_id);

        if (user) {

            const tokenJWT = jwt.sign(
                {
                    userId: user.id,
                    tenantId: user.tenant_id
                },
                process.env.JWT_SECRET
            );

            return res.json({
                success: true,
                token: tokenJWT,
                user
            });

        }

        const tenantId = await Auth.createTenant(
            `Estudio de ${name}`,
            email
        );

        const userId = await Auth.createUser({
            tenant_id: tenantId,
            google_id,
            name,
            email,
            picture_url: picture
        });

        const tokenJWT = jwt.sign(
            {
                userId: userId,
                tenantId: tenantId
            },
            process.env.JWT_SECRET
        );

        res.json({
            success: true,
            message: '¡Bienvenido a tu nueva infraestructura!',
            token: tokenJWT,
            tenant_id: tenantId
        });

    } catch (error) {

        console.error('Error en autenticación:', error);

        res.status(500).json({
            success: false,
            message: 'Error en autenticación',
            error: error.message
        });

    }

};

module.exports = {
    googleLogin
};