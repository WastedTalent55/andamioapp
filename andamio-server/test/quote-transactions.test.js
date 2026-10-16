const {test} = require('node:test');
const assert = require('node:assert/strict');
const dbPath = require.resolve('../src/config/db');
let connection;
const db = {getConnection: async () => connection, query: async () => {throw new Error('Pool used inside transaction');}};
require.cache[dbPath] = {id: dbPath, filename: dbPath, loaded: true, exports: db};
const service = require('../src/services/quoteService');
const body = {delivery_time: 3, total_amount: 100, customer_id: 1, items: [{type: 'material', description: 'Ficticio', quantity: 2, unit_price: 50, total_price: 100, unit: 'pza'}]};
function setup(status = 'borrador', failure = '') {
  const events = [];
  const action = async name => {events.push(name); if (failure === name) throw new Error(`Injected ${name}`);};
  connection = {
    beginTransaction: () => action('begin'), commit: () => action('commit'), rollback: () => action('rollback'),
    release: () => events.push('release'), destroy: () => events.push('destroy'),
    async query(sql, args) {
      let name;
      if (sql.includes('SELECT id FROM tenants')) name = 'lockTenant';
      else if (sql.includes('MAX(quote_folio)')) name = 'folio';
      else if (sql.includes('FOR UPDATE')) name = 'lockQuote';
      else if (sql.includes('INSERT INTO quotes')) name = 'header';
      else if (sql.includes('INSERT INTO quote_items')) name = 'items';
      else if (sql.includes('DELETE FROM quote_items')) name = 'deleteItems';
      else if (sql.includes('SET is_current = 0')) name = 'vigency';
      else if (sql.includes('UPDATE quotes')) name = 'updateDraft';
      else throw new Error('Unexpected SQL');
      await action(name);
      if (name === 'lockQuote') {assert.deepEqual(args, [4, 1]); return [[{quote_id: 4, tenant_id: 1, status, version_number: 1, special_conditions: 'Original', customer_id: 1}]];}
      if (name === 'lockTenant') {assert.deepEqual(args, [1]); return [[{id: 1}]];}
      if (name === 'folio') return [[{lastFolio: 3}]];
      return [{insertId: 9, affectedRows: 1}];
    }
  };
  return events;
}
for (const mode of ['create', 'draft', 'version']) {
  test(`${mode}: all operations share one connection, commit once and release`, async () => {
    const events = setup(mode === 'version' ? 'enviada' : 'borrador');
    if (mode === 'create') await service.createQuote(1, body); else await service.updateQuote(4, 1, body);
    assert.equal(events[0], 'begin'); assert.deepEqual(events.slice(-2), ['commit', 'release']);
    assert(!events.includes('rollback')); assert(events.includes('items'));
  });
}
for (const [mode, failure] of [['create', 'header'], ['create', 'items'], ['draft', 'updateDraft'], ['draft', 'deleteItems'], ['draft', 'items'], ['version', 'header'], ['version', 'vigency'], ['version', 'items']]) {
  test(`${mode}: ${failure} failure rolls back instead of committing`, async () => {
    const events = setup(mode === 'version' ? 'enviada' : 'borrador', failure);
    await assert.rejects(mode === 'create' ? service.createQuote(1, body) : service.updateQuote(4, 1, body), /Injected/);
    assert.deepEqual(events.slice(-2), ['rollback', 'release']); assert(!events.includes('commit'));
  });
}
for (const failure of ['begin', 'commit']) {
  test(`${failure} failure still rolls back and releases`, async () => {
    const events = setup('borrador', failure); await assert.rejects(service.createQuote(1, body), /Injected/);
    assert.deepEqual(events.slice(-2), ['rollback', 'release']);
  });
}
test('failed rollback discards the uncertain connection and preserves the original error', async () => {
  const events = setup('borrador', 'items');
  connection.rollback = async () => {events.push('rollback'); throw new Error('Rollback unavailable');};
  await assert.rejects(service.createQuote(1, body), error => error.message === 'Injected items' && error.cause.message === 'Rollback unavailable');
  assert.deepEqual(events.slice(-3), ['rollback', 'destroy', 'release']);
});
test('missing/foreign quote performs no writes and releases its read transaction', async () => {
  const events = setup(); connection.query = async () => {events.push('lookup'); return [[]];};
  assert.equal(await service.updateQuote(4, 2, body), null);
  assert.deepEqual(events, ['begin', 'lookup', 'commit', 'release']);
});
