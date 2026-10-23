const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const mysql = require('mysql2/promise');
const {isValidRunnerUsername} = require('./local-concurrency-setup-utils.cjs');

const DATABASE = 'andamio_concurrency_test';
const HOST = '127.0.0.1';
const CONFIRM = 'DELETE-ANDAMIO-CONCURRENCY-TEST';
const EXPECTED_TABLES = new Set([
  'tenants', 'customers', 'customer_addresses', 'evaluations', 'quotes', 'quote_items'
]);

function readJsonOutsideRepository(envName) {
  const configPath = process.env[envName];
  if (!configPath) throw new Error('Set ' + envName + ' to a private JSON file outside the repository');
  const resolved = path.resolve(configPath);
  const repo = path.resolve(__dirname, '../..');
  const relative = path.relative(repo, resolved);
  if (!relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(envName + ' must point outside the repository');
  }
  return {configPath: resolved, config: JSON.parse(fs.readFileSync(resolved, 'utf8'))};
}

(async () => {
  if (process.env.ANDAMIO_ALLOW_CONCURRENCY_TEST_CLEANUP !== CONFIRM) {
    throw new Error('Cleanup requires ANDAMIO_ALLOW_CONCURRENCY_TEST_CLEANUP=' + CONFIRM);
  }

  const runtime = readJsonOutsideRepository('ANDAMIO_TEST_CONFIG');
  const admin = readJsonOutsideRepository('ANDAMIO_TEST_ADMIN_CONFIG');
  const config = runtime.config, adminConfig = admin.config;

  if (config.mode !== 'local-concurrency' || config.database !== DATABASE ||
    config.host !== HOST || !isValidRunnerUsername(config.user) || !config.identity ||
    adminConfig.host !== HOST || !Number.isInteger(adminConfig.port) ||
    adminConfig.port !== config.port || typeof adminConfig.user !== 'string' ||
    typeof adminConfig.password !== 'string') {
    throw new Error('Refusing cleanup: local test database identity is incomplete or unexpected');
  }

  const tempParent = path.resolve(os.tmpdir());
  const configDir = path.dirname(runtime.configPath);
  const relativeTemp = path.relative(tempParent, configDir);
  if (!path.basename(configDir).startsWith('andamio-concurrency-') ||
    relativeTemp.startsWith('..') || path.isAbsolute(relativeTemp) ||
    path.basename(runtime.configPath) !== 'db.json') {
    throw new Error('Refusing cleanup: generated test config is outside its expected temporary directory');
  }

  const connection = await mysql.createConnection({
    host: HOST, port: adminConfig.port, user: adminConfig.user,
    password: adminConfig.password, charset: 'utf8mb4', connectTimeout: 5000
  });
  try {
    const [[identity]] = await connection.query(
      'SELECT @@hostname AS hostname, @@port AS port, @@server_uuid AS serverUuid, VERSION() AS version, CURRENT_USER() AS account'
    );
    const expected = config.identity;
    if (identity.hostname !== expected.hostname ||
      Number(identity.port) !== Number(expected.port) ||
      identity.serverUuid !== expected.serverUuid ||
      identity.version !== expected.version ||
      identity.account !== expected.adminAccount) {
      throw new Error('Refusing cleanup: MySQL server identity differs from the prepared local test server');
    }

    const [schemas] = await connection.query(
      'SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME = ?',
      [DATABASE]
    );
    if (schemas.length !== 1) throw new Error('Refusing cleanup: isolated test database is absent');
    const [tables] = await connection.query(
      'SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = ?',
      [DATABASE]
    );
    const names = new Set(tables.map(table => table.TABLE_NAME));
    if (names.size !== EXPECTED_TABLES.size ||
      [...EXPECTED_TABLES].some(name => !names.has(name))) {
      throw new Error('Refusing cleanup: table set differs from the six-table isolated fixture');
    }

    await connection.query('DROP DATABASE andamio_concurrency_test');
    await connection.query("DROP USER '" + config.user + "'@'127.0.0.1'");
    console.log('Removed only ' + DATABASE + ' and its generated local test user.');
  } finally {
    await connection.end();
  }

  fs.unlinkSync(runtime.configPath);
  fs.rmdirSync(configDir);
  console.log('Removed the generated credential file and its temporary directory.');
})().catch(error => {
  console.error(error.code || error.message);
  process.exitCode = 1;
});
