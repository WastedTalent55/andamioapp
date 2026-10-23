// Optional Docker-only test fixture. Refuses to reuse an existing container.
// No application .env, published ports, production database or global SQL settings.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const run = args => execFileSync('docker', args, {encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']});
(async () => {
  let exists = false;
  try {run(['inspect', 'andamio-block3-mysql']); exists = true;} catch {}
  if (exists) throw new Error('Test container already exists; preserve it. Use its verified test config or a fresh environment.');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'andamio-block3-'));
  const password = crypto.randomBytes(24).toString('hex');
  fs.writeFileSync(path.join(dir, 'mysql.env'), `MYSQL_ROOT_PASSWORD=${password}\nMYSQL_ROOT_HOST=%\n`, {mode: 0o600});
  fs.writeFileSync(path.join(dir, 'client.cnf'), `[client]\nuser=root\npassword=${password}\n`, {mode: 0o600});
  try {run(['network', 'inspect', 'andamio-block3-internal']);} catch {run(['network', 'create', '--internal', 'andamio-block3-internal']);}
  const network = JSON.parse(run(['network', 'inspect', 'andamio-block3-internal']))[0];
  if (!network.Internal) throw new Error('Refusing external network');
  // Official image, pinned to the digest used for the validated MySQL 8.4 fixture.
  run(['run', '-d', '--name', 'andamio-block3-mysql', '--label', 'andamio.block3.isolated=true',
    '--network', 'andamio-block3-internal', '--env-file', path.join(dir, 'mysql.env'),
    '--mount', `type=bind,source=${path.join(dir, 'client.cnf')},target=/run/test-client.cnf,readonly`,
    'mysql@sha256:6ea90827b1100f8f2ae306a539f86d2c264a26ed435a2a9f75551dd5c3aeb242', '--mysqlx=OFF']);
  const info = JSON.parse(run(['inspect', 'andamio-block3-mysql']))[0];
  const config = {host: info.NetworkSettings.Networks['andamio-block3-internal'].IPAddress,
    user: 'root', password, database: 'andamio_block3_test'};
  const mysql = require('mysql2/promise');
  let c;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {c = await mysql.createConnection({...config, database: undefined, connectTimeout: 1000, charset: 'utf8mb4'}); break;}
    catch {await new Promise(resolve => setTimeout(resolve, 500));}
  }
  if (!c) throw new Error('Test MySQL did not become ready');
  try {
    await c.query('CREATE DATABASE andamio_block3_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await c.query('USE andamio_block3_test'); await c.query('SET FOREIGN_KEY_CHECKS=0');
    const schema = fs.readFileSync(path.join(__dirname, '../../database/andamio_schema.sql'), 'utf8');
    const tables = schema.match(/CREATE TABLE[\s\S]+?;/g);
    if (tables?.length !== 8) throw new Error('Unexpected schema');
    for (const sql of tables) await c.query(sql.replace(/^.*`special_conditions`.*\n/m, ''));
    await c.query('SET FOREIGN_KEY_CHECKS=1');
    await c.query("INSERT INTO tenants (id,company_name,terms_conditions) VALUES (101,'Ficticio Aurora','Generales A'),(202,'Ficticio B','Generales B')");
    await c.query("INSERT INTO users (id,tenant_id,name,email) VALUES (101,101,'Alex Ficticio','alex@example.invalid'),(202,202,'Sam Ficticio','sam@example.invalid')");
    await c.query("INSERT INTO customers (id,tenant_id,first_name,last_name) VALUES (101,101,'Cliente','Ficticio'),(202,202,'Otro','Ficticio')");
    await c.query("INSERT INTO customer_addresses (customer_id,full_address) VALUES (101,'Calle ficticia 1'),(202,'Calle ficticia 2')");
    await c.query("INSERT INTO evaluations (id,tenant_id,customer_id,address_id,scheduled_date,requested_work) SELECT 101,101,101,id,'2026-12-01 12:00:00','Trabajo ficticio' FROM customer_addresses WHERE customer_id=101 LIMIT 1");
    await c.query('INSERT INTO quotes (id,tenant_id,customer_id,quote_folio,total_amount) VALUES (101,101,101,1,100)');
    await c.query(fs.readFileSync(path.join(__dirname, '../../database/migrations/001_quote_special_conditions.sql'), 'utf8'));
    const [[old]] = await c.query('SELECT special_conditions FROM quotes WHERE id=101');
    if (old.special_conditions !== null) throw new Error('Migration changed existing quote');
  } finally {await c.end();}
  const target = path.join(dir, 'db.json'); fs.writeFileSync(target, JSON.stringify(config), {mode: 0o600});
  console.log('Isolated fixture ready. Set ANDAMIO_TEST_CONFIG to this file (contains test credentials, do not commit):'); console.log(target);
})().catch(error => {console.error(error.code || error.message); process.exitCode = 1;});
