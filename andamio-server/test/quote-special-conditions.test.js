const { test } = require('node:test');
const assert = require('node:assert/strict');
// Prevent config/db from loading .env or contacting any real server.
const dbPath = require.resolve('../src/config/db');
const db = {query: async () => {throw new Error('Unexpected database query');}};
require.cache[dbPath] = {id: dbPath, filename: dbPath, loaded: true, exports: db};
const Quote = require('../src/models/quoteModel');
const service = require('../src/services/quoteService');
const controller = require('../src/controllers/quoteController');
for (const value of [42, true, {}, [], 'x'.repeat(5001), '🛠'.repeat(5001)]) {
  test(`rejects invalid conditions ${typeof value}/${typeof value === 'string' ? Array.from(value).length : '-'}`, async () => {
    await assert.rejects(service.createQuote(1, {special_conditions: value}), {code: 'INVALID_SPECIAL_CONDITIONS'});
    await assert.rejects(service.updateQuote(4, 1, {special_conditions: value}), {code: 'INVALID_SPECIAL_CONDITIONS'});
  });
}
for (const body of [{}, {special_conditions: null}, {special_conditions: ''}, {special_conditions: ' \n '}, {special_conditions: 'Acuerdo ñ\nMaterial incluido 🛠'}, {special_conditions: '🛠'.repeat(5000)}]) {
  test('creates optional conditions with authenticated tenant', async t => {
    t.mock.method(Quote, 'getNextFolio', async tenant => {assert.equal(tenant, 1); return 12;});
    let saved;
    t.mock.method(Quote, 'create', async data => {saved = data; return 9;});
    await service.createQuote(1, {...body, tenant_id: 99});
    assert.equal(saved.tenant_id, 1);
    assert.equal(saved.special_conditions, body.special_conditions?.trim() ? body.special_conditions : null);
  });
}
for (const status of ['borrador', 'enviada', 'aceptada', 'rechazada']) {
  for (const body of [{}, {special_conditions: 'Otro\nacuerdo ñ'}, {special_conditions: null}, {special_conditions: ''}]) {
    test(`${status}: omitted/replaced/cleared conditions stay independent per version`, async t => {
      const original = {quote_id: 4, status, version_number: 2, special_conditions: 'Original', is_current: 1};
      t.mock.method(Quote, 'getById', async (id, tenant) => {assert.equal(id, 4); assert.equal(tenant, 1); return original;});
      let saved;
      t.mock.method(Quote, 'update', async (id, tenant, data) => {saved = data;});
      t.mock.method(Quote, 'createVersion', async (old, tenant, data) => {assert.equal(old, original); saved = data; return 5;});
      t.mock.method(Quote, 'deleteItems', async () => {}); t.mock.method(Quote, 'markNotCurrent', async () => {});
      await service.updateQuote(4, 1, body);
      assert.equal(saved.special_conditions, Object.hasOwn(body, 'special_conditions') ? body.special_conditions || null : 'Original');
      assert.equal(original.special_conditions, 'Original');
    });
  }
}
test('foreign tenant cannot update a quote', async t => {
  t.mock.method(Quote, 'getById', async () => null); const update = t.mock.method(Quote, 'update');
  assert.equal(await service.updateQuote(4, 2, {}), null); assert.equal(update.mock.callCount(), 0);
});
test('write controllers return HTTP 400 for invalid conditions', async () => {
  for (const fn of [controller.createQuote, controller.updateQuote]) {
    const res = {statusCode: 200, status(code) {this.statusCode = code; return this;}, json(body) {this.body = body; return this;}};
    await fn({user: {tenantId: 1}, params: {id: 4}, body: {special_conditions: []}}, res);
    assert.equal(res.statusCode, 400); assert.equal(res.body.success, false);
  }
});
test('read queries expose conditions, NULL and tenant predicates', async t => {
  const calls = []; t.mock.method(db, 'query', async (sql, args) => {calls.push({sql, args}); return [[{quote_id: 4, special_conditions: null}]];});
  assert.equal((await Quote.getById(4, 1)).special_conditions, null);
  assert.equal((await Quote.getByEvaluationId(3, 1)).special_conditions, null);
  for (const call of calls) {assert.match(call.sql, /q\.special_conditions/); assert.match(call.sql, /tenant_id = \?/); assert.equal(call.args[1], 1);}
});
