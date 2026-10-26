# Quote special conditions (001)

This folder contains additive migrations, not database dumps. Never import
`database/andamio_schema.sql` over an existing database: that reference dump
contains destructive statements.

First validate 001 in a backed-up, isolated development database. In Windows
Workbench select the local connection and run these read-only checks:

```sql
SELECT @@hostname, @@port, VERSION(), DATABASE();
USE andamio_test;
SELECT COUNT(*) AS quotes_before FROM andamio_test.quotes;
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, CHARACTER_SET_NAME, COLLATION_NAME
FROM information_schema.columns
WHERE TABLE_SCHEMA = 'andamio_test' AND TABLE_NAME = 'quotes'
  AND COLUMN_NAME = 'special_conditions';
```

Stop if the server is not your intended local test server or the column already
exists. Keep the initial quote count. Open `001_quote_special_conditions.sql`
in that same connection, with `andamio_test` selected, and execute it once.
It only adds one nullable utf8mb4 TEXT column; it does not update existing rows.
DDL commits implicitly in MySQL: ROLLBACK will not undo the ALTER. A second run
fails explicitly with a duplicate-column error; inspect rather than suppress it.

Verify using the metadata query again and:

```sql
SELECT COUNT(*) AS quotes_after,
       COUNT(special_conditions) AS quotes_with_particular_conditions
FROM andamio_test.quotes;
```

Immediately after migration, the count must match the previous count and the
second result must be zero. Expect TEXT, nullable YES, utf8mb4/utf8mb4_unicode_ci.
Validate Spanish accents, ñ, emoji and line breaks on fictitious quotes through
the application before considering another environment.

Deploy order (separate approval required): backup and approved migration, backend,
then frontend. Keep the added column if application code is rolled back; removing
it would destroy newly captured conditions. No production migration runs as part
of npm tests, startup or the GitHub Pages workflow.

## Quote down payment percentage (002)

Migration `002_quote_down_payment_percent.sql` adds a per-quote integer percent
from 0 to 100. The non-null default of 50 applies to existing rows, preserving
the current behavior. It also adds a MySQL CHECK constraint for the same range.
Confirm the intended database and that neither the column nor constraint exists
before running the migration once. MySQL DDL commits implicitly; do not rerun
after an error without inspecting the resulting schema.
