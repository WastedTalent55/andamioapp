# Quote tests

`npm test` runs Node's built-in test runner. Unit tests replace config/db before
loading application modules; they never read the application .env. No new packages.

For MySQL integration, in a fresh Linux Docker environment run
`node test/setup-isolated.cjs`. It creates **andamio-block3-mysql**, a new MySQL 8.4
container on an internal network with no published ports, and two fictitious tenants
and users. It extracts only CREATE TABLE statements into a fresh test schema,
simulates a pre-migration quote and applies migration 001. It refuses to reuse or
reset an existing container and keeps credentials in a private temporary folder.
No other database is selected. The original setup of the cloud instance uses a
different container and is not reused.

Set `ANDAMIO_TEST_CONFIG` to the printed JSON path, then run `npm test`. The helper
verifies the container label, internal network, IP address and exact test database
before connecting. Tests insert fictitious quotes and retain them for inspection;
they do not reset data. With no configuration, integration tests are explicitly
skipped. The setup targets Linux Docker networking; it is not a Windows-local
Workbench setup. Use the migration README for your local `andamio_test` instead.

The integration suite exercises real mysql2 queries and real Express routes with
short-lived JWTs signed using an ephemeral test-only secret. Google sign-in,
Railway, production accounts and WhatsApp sending are not used. Never add test
JSON/config files or tokens to Git.
