const {test} = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../src/config/db');
const db = {
  query: async () => {throw new Error('Unexpected pool query');},
  getConnection: async () => ({
    async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
    async query(sql, args) {
      if (sql.includes('SELECT id FROM tenants')) return [[{id: 1}]];
      if (sql.includes('MAX(quote_folio)')) return [[{lastFolio: 0}]];
      if (sql.includes('FOR UPDATE')) return [[{quote_id: 4, tenant_id: 1, status: 'borrador', version_number: 2,
        down_payment_percent: 42, is_current: 1}]];
      return [{insertId: 9, affectedRows: 1}];
    }
  })
};
require.cache[dbPath] = {id: dbPath, filename: dbPath, loaded: true, exports: db};
const Quote = require('../src/models/quoteModel');
const service = require('../src/services/quoteService');
const controller = require('../src/controllers/quoteController');

test('create defaults deposit percent to 50 and persists a supplied value', async t => {
  t.mock.method(Quote, 'getNextFolio', async () => 1);
  let saved;
  t.mock.method(Quote, 'create', async data => {saved = data; return 9;});

  await service.createQuote(1, {});
  assert.equal(saved.down_payment_percent, 50);
  await service.createQuote(1, {down_payment_percent: 37});
  assert.equal(saved.down_payment_percent, 37);
  for (const percent of [0, 100]) {
    await service.createQuote(1, {down_payment_percent: percent});
    assert.equal(saved.down_payment_percent, percent);
  }
});

for (const value of [-1, 100.1, 101, '50', null, true]) {
  test(`rejects invalid deposit percentage ${String(value)}`, async () => {
    await assert.rejects(service.createQuote(1, {down_payment_percent: value}), {code: 'INVALID_DOWN_PAYMENT_PERCENT'});
    await assert.rejects(service.updateQuote(4, 1, {down_payment_percent: value}), {code: 'INVALID_DOWN_PAYMENT_PERCENT'});
  });
}

for (const status of ['borrador', 'enviada', 'aceptada', 'rechazada']) {
  test(`${status} quote updates preserve or replace its deposit percent`, async t => {
    const original = {quote_id: 4, tenant_id: 1, status, version_number: 2, down_payment_percent: 42, is_current: 1};
    t.mock.method(Quote, 'getForUpdate', async () => original);
    let saved;
    t.mock.method(Quote, 'update', async (id, tenant, data) => {saved = data;});
    t.mock.method(Quote, 'createVersion', async (previous, tenant, data) => {saved = data; return 5;});
    t.mock.method(Quote, 'deleteItems', async () => {}); t.mock.method(Quote, 'markNotCurrent', async () => {});

    await service.updateQuote(4, 1, {down_payment_percent: 65});
    assert.equal(saved.down_payment_percent, 65);
    await service.updateQuote(4, 1, {});
    assert.equal(saved.down_payment_percent, 42);
    assert.equal(original.down_payment_percent, 42);
  });
}

test('create and update controllers translate invalid deposit percentage into HTTP 400', async t => {
  for (const method of ['createQuote', 'updateQuote']) {
    t.mock.method(service, method, async () => {throw Object.assign(new Error('invalid'), {code: 'INVALID_DOWN_PAYMENT_PERCENT'});});
    const res = {statusCode: 200, status(code) {this.statusCode = code; return this;}, json(body) {this.body = body; return this;}};
    await controller[method]({user: {tenantId: 1}, params: {id: 4}, body: {}}, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  }
});

test('quote model binds deposit percent on create, update, and each saved version', async () => {
  const calls = [];
  const connection = {async query(sql, args) {calls.push({sql, args}); return [{insertId: 9, affectedRows: 1}];}};
  const data = {tenant_id: 1, quote_folio: 3, evaluation_id: null, customer_id: 2, delivery_time: 4,
    evaluation_discount: 10, total_amount: 90, down_payment_percent: 35, version_number: 1};

  await Quote.create(data, connection);
  await Quote.update(9, 1, data, connection);
  await Quote.createVersion({...data, quote_id: 9, root_quote_id: 9}, 1, data, connection);

  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.match(call.sql, /down_payment_percent/);
    assert(call.args.includes(35));
  }
});

test('quote reads return the percent and version history retains it per snapshot', async t => {
  const calls = [];
  t.mock.method(db, 'query', async sql => {
    calls.push(sql);
    if (sql.includes('SELECT root_quote_id')) return [[{root_quote_id: 1}]];
    return [[{quote_id: 9, down_payment_percent: 37}]];
  });

  assert.equal((await Quote.getById(9, 1)).down_payment_percent, 37);
  assert.equal((await Quote.getByEvaluationId(2, 1)).down_payment_percent, 37);
  assert.equal((await Quote.getVersionHistory(9, 1))[0].down_payment_percent, 37);
  assert(calls.some(sql => sql.includes('q.down_payment_percent')));
  assert(calls.some(sql => sql.includes('total_amount,') && sql.includes('down_payment_percent')));
});
