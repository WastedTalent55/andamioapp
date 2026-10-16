const {test} = require('node:test');
const assert = require('node:assert/strict');
test('MySQL isolated transaction/rollback checks', {skip: !process.env.ANDAMIO_TEST_CONFIG}, async t => {
  const pool = await require('./isolated-db.cjs')();
  const dbPath = require.resolve('../src/config/db');
  require.cache[dbPath] = {id: dbPath, filename: dbPath, loaded: true, exports: pool};
  const service = require('../src/services/quoteService'), Quote = require('../src/models/quoteModel');
  const data = {customer_id: 202, evaluation_id: null, delivery_time: 3, total_amount: 100,
    special_conditions: 'Original', items: [{type: 'material', description: 'Ficticio', quantity: 2, unit_price: 50, total_price: 100, unit: 'pza'}]};
  // Use tenant 202 so this file can run in parallel with tenant 101 contract tests.
  async function snapshot() {
    const [quotes] = await pool.query('SELECT * FROM quotes WHERE tenant_id=202 ORDER BY id');
    const [items] = await pool.query('SELECT i.* FROM quote_items i JOIN quotes q ON q.id=i.quote_id WHERE q.tenant_id=202 ORDER BY i.id');
    return {quotes, items};
  }
  try {
    await t.test('successful save commits both header and items', async () => {
      const id = await service.createQuote(202, data), saved = await service.getQuoteById(id, 202);
      assert.equal(saved.special_conditions, 'Original'); assert.equal(saved.items.length, 1); assert.equal(Number(saved.items[0].total_price), 100);
    });
    await t.test('real NOT NULL error inserting an item rolls back the new header', async () => {
      const before = await snapshot();
      await assert.rejects(service.createQuote(202, {...data, items: [{...data.items[0], description: null}]}), {code: 'ER_BAD_NULL_ERROR'});
      assert.deepEqual(await snapshot(), before);
    });
    await t.test('real item error rolls back draft header, totals, conditions and deleted items', async () => {
      const id = await service.createQuote(202, data), before = await snapshot();
      await assert.rejects(service.updateQuote(id, 202, {...data, total_amount: 999, special_conditions: 'No confirmar', items: [{...data.items[0], description: null}]}), {code: 'ER_BAD_NULL_ERROR'});
      assert.deepEqual(await snapshot(), before);
    });
    await t.test('failed new-version INSERT leaves source and items intact', async () => {
      const id = await service.createQuote(202, data); await service.updateQuoteStatus(id, 202, 'enviada');
      const before = await snapshot();
      await assert.rejects(service.updateQuote(id, 202, {...data, delivery_time: 'not-an-integer'}));
      assert.deepEqual(await snapshot(), before);
    });
    await t.test('failure after changing vigency rolls back both version and source changes', async sub => {
      const id = await service.createQuote(202, data); await service.updateQuoteStatus(id, 202, 'enviada');
      const before = await snapshot(), mark = Quote.markNotCurrent;
      sub.mock.method(Quote, 'markNotCurrent', async (...args) => {await mark(...args); throw new Error('Injected vigency failure');});
      await assert.rejects(service.updateQuote(id, 202, data), /Injected vigency failure/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test('item failure after new-version INSERT and vigency change rolls back everything', async () => {
      const id = await service.createQuote(202, data); await service.updateQuoteStatus(id, 202, 'aceptada'); const before = await snapshot();
      await assert.rejects(service.updateQuote(id, 202, {...data, items: [{...data.items[0], description: null}]}), {code: 'ER_BAD_NULL_ERROR'});
      assert.deepEqual(await snapshot(), before);
    });
    await t.test('tenant mismatch leaves all tenant data unchanged', async () => {
      const id = await service.createQuote(202, data), before = await snapshot();
      assert.equal(await service.updateQuote(id, 101, {...data, total_amount: 999}), null); assert.deepEqual(await snapshot(), before);
    });
    await t.test('concurrent creates receive different tenant folios', async () => {
      const ids = await Promise.all(Array.from({length: 4}, () => service.createQuote(202, data)));
      const rows = await Promise.all(ids.map(id => service.getQuoteById(id, 202)));
      assert.equal(new Set(rows.map(q => q.quote_folio)).size, 4);
      for (const row of rows) assert.equal(row.items.length, 1);
    });
    await t.test('concurrent stale-source edits stay atomic; unresolved branching is reported', async sub => {
      const id = await service.createQuote(202, data); await service.updateQuoteStatus(id, 202, 'enviada');
      const versions = await Promise.all([service.updateQuote(id, 202, data), service.updateQuote(id, 202, {...data, special_conditions: 'Concurrente'})]);
      for (const version of versions) assert.equal((await service.getQuoteById(version.quoteId, 202)).items.length, 1);
      assert.equal((await service.getQuoteById(id, 202)).special_conditions, 'Original');
      const [[count]] = await pool.query('SELECT COUNT(*) AS total FROM quotes WHERE root_quote_id=? AND is_current=1', [id]);
      sub.diagnostic(`Known unchanged versioning limitation: ${count.total} current successors from the same stale source. See README before publication.`);
    });
  } finally {await pool.end();}
});
