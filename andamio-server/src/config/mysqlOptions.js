const fs = require('node:fs');
const net = require('node:net');

function buildMysqlOptions(env = process.env) {
    const configuredPort = env.DB_PORT === undefined || env.DB_PORT === ''
        ? 3306
        : Number(env.DB_PORT);

    if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65535) {
        throw new Error('DB_PORT must be an integer between 1 and 65535.');
    }

    const options = {
        host: env.DB_HOST,
        port: configuredPort,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

    if (String(env.DB_SSL).toLowerCase() === 'true') {
        if (!env.DB_HOST || net.isIP(env.DB_HOST)) {
            throw new Error('DB_HOST must be a DNS hostname when DB_SSL is enabled so the server identity can be verified.');
        }
        if (!env.DB_SSL_CA_PATH) {
            throw new Error('DB_SSL_CA_PATH is required when DB_SSL is enabled.');
        }

        const ca = fs.readFileSync(env.DB_SSL_CA_PATH, 'utf8');
        if (!ca.includes('-----BEGIN CERTIFICATE-----') || !ca.includes('-----END CERTIFICATE-----')) {
            throw new Error('DB_SSL_CA_PATH must point to a PEM CA certificate.');
        }

        options.ssl = {
            ca,
            rejectUnauthorized: true,
            verifyIdentity: true
        };
    }

    return options;
}

module.exports = buildMysqlOptions;
