// Explicit opt-in: ANDAMIO_TEST_CONFIG points to credentials outside Git.
// Only the labelled container on its single internal network is accepted.
// Test database must be andamio_block3_test. Never loads the application's .env.
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
module.exports = async function isolatedDb() {
  const config = JSON.parse(fs.readFileSync(process.env.ANDAMIO_TEST_CONFIG, 'utf8'));
  if (config.database !== 'andamio_block3_test') throw new Error('Refusing non-test database');
  const info = JSON.parse(execFileSync('docker', ['inspect', 'andamio-block3-mysql'], {encoding: 'utf8'}))[0];
  const network = JSON.parse(execFileSync('docker', ['network', 'inspect', 'andamio-block3-internal'], {encoding: 'utf8'}))[0];
  if (info.Config.Labels['andamio.block3.isolated'] !== 'true' || !network.Internal ||
    Object.keys(info.NetworkSettings.Networks).length !== 1 ||
    config.host !== info.NetworkSettings.Networks['andamio-block3-internal'].IPAddress) throw new Error('Refusing unverified test server');
  return require('mysql2/promise').createPool({...config, charset: 'utf8mb4', connectionLimit: 6});
};
