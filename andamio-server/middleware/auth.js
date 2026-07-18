const jwt = require('jsonwebtoken');

const SECRET = 'SECRETO_SUPER_SEGURO';

function verifyToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Token no proporcionado'
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }

    try {

        const decoded = jwt.verify(token, SECRET);

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });

    }

}

module.exports = verifyToken;