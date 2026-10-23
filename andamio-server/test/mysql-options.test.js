const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {EventEmitter} = require('node:events');
const tls = require('node:tls');
const BaseConnection = require(path.join(path.dirname(require.resolve('mysql2')), 'lib/base/connection'));
const buildMysqlOptions = require('../src/config/mysqlOptions');

const baseEnv = {
    DB_HOST: '127.0.0.1',
    DB_USER: 'andamio_dev',
    DB_NAME: 'andamio_test'
};

test('local MySQL settings keep TLS off by default and use port 3306', () => {
    const options = buildMysqlOptions(baseEnv);
    assert.equal(options.database, 'andamio_test');
    assert.equal(options.port, 3306);
    assert.equal(options.ssl, undefined);
});

test('DB_PORT is converted to a numeric MySQL port', () => {
    assert.equal(buildMysqlOptions({...baseEnv, DB_PORT: '28173'}).port, 28173);
});

test('Aiven TLS config is enforced by MySQL2 and verifies the DNS identity', async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'andamio-ca-'));
    t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
    const caPath = path.join(directory, 'ca.pem');
    const caPem = '-----BEGIN CERTIFICATE-----\nlocal-test-certificate\n-----END CERTIFICATE-----\n';
    fs.writeFileSync(caPath, caPem);

    const options = buildMysqlOptions({
        ...baseEnv,
        DB_HOST: 'mysql.example.aivencloud.com',
        DB_SSL: 'true',
        DB_SSL_CA_PATH: caPath
    });

    assert.equal(options.ssl.ca, caPem);
    assert.equal(options.ssl.rejectUnauthorized, true);
    assert.equal(options.ssl.verifyIdentity, true);

    const originalCreateSecureContext = tls.createSecureContext;
    const originalConnect = tls.connect;
    const originalCheckServerIdentity = tls.checkServerIdentity;
    const secureContext = {};
    const identityError = new Error('hostname mismatch');
    const checkedHostnames = [];
    let tlsOptions;

    tls.createSecureContext = contextOptions => {
        assert.equal(contextOptions.ca, caPem);
        return secureContext;
    };
    tls.checkServerIdentity = hostname => {
        checkedHostnames.push(hostname);
        return identityError;
    };
    tls.connect = (connectOptions, callback) => {
        tlsOptions = connectOptions;
        const socket = new EventEmitter();
        socket.getPeerCertificate = () => ({subject: {CN: 'wrong.example.test'}});
        setImmediate(callback);
        return socket;
    };

    t.after(() => {
        tls.createSecureContext = originalCreateSecureContext;
        tls.connect = originalConnect;
        tls.checkServerIdentity = originalCheckServerIdentity;
    });

    const connection = Object.create(BaseConnection.prototype);
    connection.config = {host: 'mysql.example.aivencloud.com', ssl: options.ssl};
    connection.stream = {removeAllListeners() {}};
    connection.packetParser = {execute() {}};

    const actualResult = await new Promise(resolve => connection.startTLS(error => resolve(error)));

    assert.equal(tlsOptions.rejectUnauthorized, true);
    assert.equal(tlsOptions.requestCert, true);
    assert.equal(tlsOptions.servername, 'mysql.example.aivencloud.com');
    assert.equal(tlsOptions.checkServerIdentity, tls.checkServerIdentity);
    assert.equal(actualResult, identityError);
    assert.deepEqual(checkedHostnames, ['mysql.example.aivencloud.com']);
});

test('Aiven TLS fails closed when its CA path is missing or invalid', () => {
    const tlsEnv = {...baseEnv, DB_HOST: 'mysql.example.aivencloud.com', DB_SSL: 'true'};
    assert.throws(() => buildMysqlOptions(tlsEnv), /DB_SSL_CA_PATH is required/);
    assert.throws(() => buildMysqlOptions({...baseEnv, DB_PORT: 'not-a-port'}), /DB_PORT must be an integer/);
    assert.throws(() => buildMysqlOptions({
        ...baseEnv,
        DB_HOST: '127.0.0.1',
        DB_SSL: 'true',
        DB_SSL_CA_PATH: 'ca.pem'
    }), /DB_HOST must be a DNS hostname/);
});
