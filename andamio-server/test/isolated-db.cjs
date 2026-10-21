const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {isValidRunnerUsername} = require('./local-concurrency-setup-utils.cjs');

const LOCAL_DATABASE = 'andamio_concurrency_test';
const LOOPBACK_HOST = '127.0.0.1';

async function localPool(config) {
  if (config.database !== LOCAL_DATABASE ||
    config.host !== LOOPBACK_HOST ||
    !Number.isInteger(config.port) || config.port < 1 || config.port > 65535 ||
    !isValidRunnerUsername(config.user) ||
    typeof config.password !== 'string' || !config.password ||
    !config.identity || typeof config.identity !== 'object') {
    throw new Error('Refusing unverified local concurrency test configuration');
  }

  const {hostname, port, serverUuid, version} = config.identity;
  if (typeof hostname !== 'string' || !hostname ||
    Number(port) !== config.port ||
    typeof serverUuid !== 'string' || !serverUuid ||
    typeof version !== 'string' || !/^8\.0\./.test(version)) {
    throw new Error('Refusing incomplete local MySQL server identity');
  }

  const pool = require('mysql2/promise').createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: LOCAL_DATABASE,
    charset: 'utf8mb4',
    connectionLimit: 4
  });

  try {
    const connection = await pool.getConnection();
    try {
      const [[identity]] = await connection.query(
        'SELECT DATABASE() AS databaseName, @@hostname AS hostname, @@port AS port, @@server_uuid AS serverUuid, VERSION() AS version, CURRENT_USER() AS account'
      );
      if (identity.databaseName !== LOCAL_DATABASE ||
        identity.hostname !== hostname ||
        Number(identity.port) !== Number(port) ||
        identity.serverUuid !== serverUuid ||
        identity.version !== version ||
        identity.account !== config.user + '@127.0.0.1') {
        throw new Error('Local MySQL connection identity does not match the isolated test config');
      }
      const required = ['tenants', 'customers', 'customer_addresses', 'evaluations', 'quotes', 'quote_items'];
      const [tables] = await connection.query(
        'SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = ?',
        [LOCAL_DATABASE]
      );
      const names = new Set(tables.map(table => table.TABLE_NAME));
      if (names.size !== required.length || required.some(name => !names.has(name))) {
        throw new Error('Local concurrency test schema is incomplete or contains unexpected tables');
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    await pool.end();
    throw error;
  }
  return pool;
}

module.exports = async function isolatedDb() {
  const configPath = process.env.ANDAMIO_TEST_CONFIG;
  if (!configPath) throw new Error('ANDAMIO_TEST_CONFIG is required for MySQL integration tests');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (config.mode === 'local-concurrency') {
    const resolved = path.resolve(configPath);
    const tempDir = path.dirname(resolved);
    const relative = path.relative(path.resolve(os.tmpdir()), tempDir);
    if (!path.basename(tempDir).startsWith('andamio-concurrency-') ||
      relative.startsWith('..') || path.isAbsolute(relative) || path.basename(resolved) !== 'db.json') {
      throw new Error('Refusing local test config outside its generated temporary folder');
    }
    return localPool(config);
  }
  if (config.mode !== undefined) throw new Error('Refusing unknown MySQL test mode');
  if (config.database !== 'andamio_block3_test') throw new Error('Refusing non-test database');

  const info = JSON.parse(execFileSync('docker', ['inspect', 'andamio-block3-mysql'], {encoding: 'utf8'}))[0];
  const network = JSON.parse(execFileSync('docker', ['network', 'inspect', 'andamio-block3-internal'], {encoding: 'utf8'}))[0];
  if (info.Config.Labels['andamio.block3.isolated'] !== 'true' || !network.Internal ||
    Object.keys(info.NetworkSettings.Networks).length !== 1 ||
    config.host !== info.NetworkSettings.Networks['andamio-block3-internal'].IPAddress) {
    throw new Error('Refusing unverified test server');
  }
  return require('mysql2/promise').createPool({...config, charset: 'utf8mb4', connectionLimit: 6});
};
