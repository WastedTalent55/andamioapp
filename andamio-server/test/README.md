# Quote tests

npm test runs Node's built-in test runner. Unit tests replace config/db before
loading application modules; they never read the application .env. No new packages.

## Docker integration fixture

For the existing Docker integration environment, in a fresh Linux Docker setup run
node test/setup-isolated.cjs. It creates andamio-block3-mysql, a new MySQL 8.4
container on an internal network with no published ports, and two fictitious tenants
and users. It extracts only CREATE TABLE statements into a fresh test schema,
simulates a pre-migration quote and applies migration 001. It refuses to reuse or
reset an existing container and keeps credentials in a private temporary folder.
No other database is selected.

Set ANDAMIO_TEST_CONFIG to the printed JSON path, then run npm test. The helper
verifies the container label, internal network, IP address and exact test database
before connecting. Tests insert fictitious quotes and retain them for inspection;
they do not reset data. With no configuration, integration tests are explicitly
skipped. This setup targets Linux Docker networking.

## Local MySQL concurrency fixture

The local mode is opt-in and accepts only a fresh database named
andamio_concurrency_test on 127.0.0.1 running MySQL 8.0. It does not read the backend
.env, accept andamio_test, or fall back to the Docker fixture. The admin
configuration must be a private JSON file outside the repository, provided through
ANDAMIO_TEST_ADMIN_CONFIG. The setup refuses to continue if the target database
already exists. It extracts only six CREATE TABLE definitions from the reference
schema (tenants, customers, customer_addresses, evaluations, quotes, and
quote_items); it never sends DROP TABLE statements or runs migrations. It seeds
only fictional tenant/customer rows, then creates a random local test login with
SELECT, INSERT, and UPDATE privileges on the dedicated database. The test
helper checks the exact database, loopback host, port, MySQL version, server
hostname and server_uuid before returning a connection.

Before setup, run this read-only query on the intended local connection and record its output:

    SELECT @@hostname, @@port, @@server_uuid, VERSION();

The admin config must supply the expected hostname, server UUID and version; setup refuses a mismatch.

The setup requires a local MySQL administrator login with privileges to create a
database, create tables, insert fixtures, create a user, grant those three
database-scoped privileges, read the server identity/metadata, and check the generated test-user name in mysql.user. It does not use
the application's backend credentials. If any permission is missing, stop; do not
broaden the test runner's privileges.

PowerShell example (use credentials for the local MySQL 8.0 server; the admin
config is written under the current user's temporary directory):

    Set-Location 'C:\Users\frittz\Desktop\andamioApp-proyect\andamio-server'

    $adminDir = Join-Path $env:TEMP ('andamio-concurrency-admin-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $adminDir | Out-Null
    $adminConfigPath = Join-Path $adminDir 'admin.json'
    $adminUser = Read-Host 'Local MySQL administrator user'
    $adminSecurePassword = Read-Host 'Local MySQL administrator password' -AsSecureString
    $adminPassword = [Net.NetworkCredential]::new('', $adminSecurePassword).Password
    $expectedHostname = Read-Host 'Expected @@hostname from the read-only identity query'
    $expectedServerUuid = Read-Host 'Expected @@server_uuid from the read-only identity query'
    $expectedVersion = Read-Host 'Expected VERSION() from the read-only identity query'
    $adminConfig = @{ host = '127.0.0.1'; port = $mysqlPort; user = $adminUser; password = $adminPassword; expectedHostname = $expectedHostname; expectedServerUuid = $expectedServerUuid; expectedVersion = $expectedVersion } | ConvertTo-Json
    [IO.File]::WriteAllText($adminConfigPath, $adminConfig, [Text.UTF8Encoding]::new($false))
    $adminPassword = $null
    $env:ANDAMIO_TEST_ADMIN_CONFIG = $adminConfigPath

    $setupOutput = & node .\test\setup-local-concurrency.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Local test setup failed; inspect MySQL before retrying.' }
    $setupOutput
    $configLine = $setupOutput | Where-Object { $_ -like 'ANDAMIO_TEST_CONFIG=*' } | Select-Object -Last 1
    if (-not $configLine) { throw 'Setup did not print the isolated test config path.' }
    $env:ANDAMIO_TEST_CONFIG = $configLine.Substring('ANDAMIO_TEST_CONFIG='.Length)

    & node --test --test-name-pattern='MySQL isolated transaction/rollback checks|concurrent requests on one sent version yield one successor and one 409' .\test\quote-rollback-integration.test.js
    $testExitCode = $LASTEXITCODE
    if ($testExitCode -ne 0) { throw 'The isolated concurrency integration test failed.' }

The name pattern selects the transaction integration parent and only its concurrent
HTTP subtest. No other integration file is run. The test inserts a source quote, its
items, and one successor; it retains them for consistency inspection and does not
delete rows.

After reviewing the result, remove the isolated database, generated MySQL test user,
and runtime config using the guarded cleanup script:

    $env:ANDAMIO_ALLOW_CONCURRENCY_TEST_CLEANUP = 'DELETE-ANDAMIO-CONCURRENCY-TEST'
    & node .\test\cleanup-local-concurrency.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Cleanup refused or failed; inspect the dedicated test database.' }

    Remove-Item Env:ANDAMIO_ALLOW_CONCURRENCY_TEST_CLEANUP
    Remove-Item Env:ANDAMIO_TEST_CONFIG
    Remove-Item Env:ANDAMIO_TEST_ADMIN_CONFIG
    Remove-Item -LiteralPath $adminConfigPath
    Remove-Item -LiteralPath $adminDir

Cleanup validates the local server identity and the exact six-table fixture before
dropping only andamio_concurrency_test and its generated runner account. Keep the
admin config until cleanup succeeds. If setup fails after creating the database, do
not rerun setup: it will refuse to reuse that database. Inspect it and remove only
the exact isolated database after confirming the local server identity.

## Integration test behavior

The integration suite exercises real mysql2 queries and Express routes with
short-lived JWTs signed using an ephemeral test-only secret. Google sign-in,
Railway, production accounts and WhatsApp sending are not used. Never add test
JSON/config files or tokens to Git.

Transaction tests verify the same connection is used for every save query, cleanup
on commit/begin/rollback errors, and tenant-scoped locking. Integration failures use
real SQL errors; one test injects an exception after a real vigency UPDATE. Before
and after snapshots must match after rollback. Integration files use separate tenant
fixtures so Node can run them concurrently. The stale-source integration test sends
two concurrent authenticated PUT requests to the same sent version and checks for
one HTTP 200, one HTTP 409, and a single current successor.