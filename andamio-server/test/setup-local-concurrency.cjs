const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const mysql = require('mysql2/promise');
const {createRunnerUsername, validateRunnerUsername} = require('./local-concurrency-setup-utils.cjs');

const DATABASE = 'andamio_concurrency_test';
const HOST = '127.0.0.1';
const TABLE_ORDER = ['tenants', 'customers', 'customer_addresses', 'evaluations', 'quotes', 'quote_items'];

async function runQuery(connection, operation, sql, parameters) {
  try {
    return await connection.query(sql, parameters);
  } catch (error) {
    error.setupOperation = operation;
    throw error;
  }
}

function assertConfigOutsideRepository(configPath) {
  const resolved = path.resolve(configPath);
  const repo = path.resolve(__dirname, '../..');
  const relative = path.relative(repo, resolved);
  if (!relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Admin config must be outside the repository');
  }
}

function readAdminConfig() {
  const configPath = process.env.ANDAMIO_TEST_ADMIN_CONFIG;
  if (!configPath) throw new Error('Set ANDAMIO_TEST_ADMIN_CONFIG to a private JSON file outside the repository');
  assertConfigOutsideRepository(configPath);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (config.host !== HOST ||
    !Number.isInteger(config.port) || config.port < 1 || config.port > 65535 ||
    typeof config.user !== 'string' || !config.user ||
    typeof config.password !== 'string' || !config.password ||
    typeof config.expectedHostname !== 'string' || !config.expectedHostname ||
    typeof config.expectedServerUuid !== 'string' || !config.expectedServerUuid ||
    typeof config.expectedVersion !== 'string' || !config.expectedVersion) {
    throw new Error('Admin config must specify host 127.0.0.1, a valid port and local MySQL credentials');
  }
  return config;
}

function extractRequiredTables(schema) {
  const statements = new Map();
  const pattern = /CREATE TABLE \x60([^\x60]+)\x60 \([\s\S]*?\) ENGINE=[^;]+;/g;
  for (const match of schema.matchAll(pattern)) statements.set(match[1], match[0]);
  if (TABLE_ORDER.some(name => !statements.has(name))) {
    throw new Error('Reference schema is missing a required table definition');
  }
  const result = TABLE_ORDER.map(name => statements.get(name));
  if (result.some(sql => /\bDROP\s+TABLE\b/i.test(sql)) ||
    !statements.get('quotes').includes('\x60special_conditions\x60')) {
    throw new Error('Refusing unsafe or incomplete local test table definitions');
  }
  return result;
}

(async () => {
  const admin = readAdminConfig();
  const connection = await mysql.createConnection({
    host: HOST, port: admin.port, user: admin.user, password: admin.password,
    charset: 'utf8mb4', connectTimeout: 5000
  });

  try {
    const [[identity]] = await runQuery(connection, 'verify MySQL server identity',
      'SELECT @@hostname AS hostname, @@port AS port, @@server_uuid AS serverUuid, VERSION() AS version, CURRENT_USER() AS account'
    );
    if (Number(identity.port) !== admin.port || !/^8\.0\./.test(identity.version) ||
      typeof identity.serverUuid !== 'string' || !identity.serverUuid ||
      identity.hostname !== admin.expectedHostname ||
      identity.serverUuid !== admin.expectedServerUuid ||
      identity.version !== admin.expectedVersion) {
      throw new Error('Expected the configured local MySQL 8.0 server; no changes made');
    }

    const [existing] = await runQuery(connection, 'check isolated database does not already exist',
      'SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME = ?',
      [DATABASE]
    );
    if (existing.length !== 0) throw new Error(DATABASE + ' already exists; refusing to reuse or reset it');

    const runner = createRunnerUsername();
    const runnerPassword = require('node:crypto').randomBytes(24).toString('hex');
    const [existingUsers] = await runQuery(connection, 'check generated test username is unused',
      'SELECT User FROM mysql.user WHERE User = ? AND Host = ?',
      [runner, HOST]
    );
    if (existingUsers.length !== 0) throw new Error('Generated test-user name already exists; refusing to reuse it');

    const schema = fs.readFileSync(path.join(__dirname, '../../database/andamio_schema.sql'), 'utf8');
    const statements = extractRequiredTables(schema);

    // This is a new, exact-name database. No DROP statements and no migration are run.
    await runQuery(connection, 'create isolated database', 'CREATE DATABASE ' + DATABASE + ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await runQuery(connection, 'select isolated database', 'USE ' + DATABASE);
    for (const statement of statements) await runQuery(connection, 'create table from allowlisted schema', statement);
    await runQuery(connection, 'insert fictitious tenant',
      "INSERT INTO tenants (id, company_name, terms_conditions) VALUES (202, 'Ficticio Concurrencia', 'Condiciones ficticias')"
    );
    await runQuery(connection, 'insert fictitious customer',
      "INSERT INTO customers (id, tenant_id, first_name, last_name) VALUES (202, 202, 'Cliente', 'Prueba')"
    );

    validateRunnerUsername(runner);
    await runQuery(connection, 'create isolated test user', "CREATE USER '" + runner + "'@'" + HOST + "' IDENTIFIED BY '" + runnerPassword + "'");
    await runQuery(connection, 'grant isolated database permissions', 'GRANT SELECT, INSERT, UPDATE, DELETE ON ' + DATABASE + ".* TO '" + runner + "'@'" + HOST + "'");

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'andamio-concurrency-'));
    const configPath = path.join(tempDir, 'db.json');
    const testConfig = {
      mode: 'local-concurrency',
      host: HOST,
      port: admin.port,
      user: runner,
      password: runnerPassword,
      database: DATABASE,
      identity: {
        hostname: identity.hostname,
        port: Number(identity.port),
        serverUuid: identity.serverUuid,
        version: identity.version, adminAccount: identity.account
      }
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig), {mode: 0o600});
    console.log('ANDAMIO_TEST_CONFIG=' + configPath);
    console.log('Database prepared: ' + DATABASE + '; server ' + identity.hostname + ':' + identity.port + '; UUID ' + identity.serverUuid);
  } finally {
    await connection.end();
  }
})().catch(error => {
  // Do not print the driver's message: it can include SQL text and credential values.
  const operation = error.setupOperation || 'configuration or preflight validation';
  console.error('Local concurrency setup failed during ' + operation + ': ' + (error.code || 'SETUP_ERROR'));
  process.exitCode = 1;
});
