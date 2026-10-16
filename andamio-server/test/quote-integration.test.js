const {test} = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
test('MySQL isolated quote contracts', {skip: !process.env.ANDAMIO_TEST_CONFIG}, async t => {
  const pool = await require('./isolated-db.cjs')();
  const dbPath = require.resolve('../src/config/db');
  require.cache[dbPath] = {id: dbPath, filename: dbPath, loaded: true, exports: pool};
  const service = require('../src/services/quoteService');
  const item = {type: 'material', description: 'Ficticio', quantity: 2, unit_price: 50, unit: 'pza', total_price: 100};
  const data = {customer_id: 101, evaluation_id: null, delivery_time: 3, version_number: 1, total_amount: 100, evaluation_discount: 0, items: [item]};
  const [[tenantBefore]] = await pool.query('SELECT terms_conditions FROM tenants WHERE id = 101');
  let id;
  try {
    await t.test('legacy NULL and nullable utf8mb4 metadata', async () => {
      assert.equal((await service.getQuoteById(101, 101)).special_conditions, null);
      const [rows] = await pool.query("SELECT CHARACTER_SET_NAME, IS_NULLABLE FROM information_schema.columns WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotes' AND COLUMN_NAME = 'special_conditions'");
      assert.equal(rows[0].CHARACTER_SET_NAME, 'utf8mb4'); assert.equal(rows[0].IS_NULLABLE, 'YES');
    });
    await t.test('create accented/emoji text and line breaks without changing money', async () => {
      id = await service.createQuote(101, {...data, special_conditions: 'Acuerdo ñ: material incluido 🛠\nEntrega pactada'});
      const quote = await service.getQuoteById(id, 101);
      assert.equal(quote.special_conditions, 'Acuerdo ñ: material incluido 🛠\nEntrega pactada');
      assert.equal(Number(quote.total_amount), 100); assert.equal(Number(quote.items[0].total_price), 100);
    });
    await t.test('edit, omission, clear and create without conditions', async () => {
      await service.updateQuote(id, 101, {...data, special_conditions: 'Texto cambiado'});
      await service.updateQuote(id, 101, data);
      assert.equal((await service.getQuoteById(id, 101)).special_conditions, 'Texto cambiado');
      await service.updateQuote(id, 101, {...data, special_conditions: ''});
      assert.equal((await service.getQuoteById(id, 101)).special_conditions, null);
      const without = await service.createQuote(101, data);
      assert.equal((await service.getQuoteById(without, 101)).special_conditions, null);
    });
    await t.test('every sent/accepted/rejected source retains its conditions independently', async () => {
      for (const status of ['enviada', 'aceptada', 'rechazada']) {
        const source = await service.createQuote(101, {...data, special_conditions: 'Original'});
        await service.updateQuoteStatus(source, 101, status);
        const next = await service.updateQuote(source, 101, data);
        assert.equal(next.versioned, true);
        assert.equal((await service.getQuoteById(next.quoteId, 101)).special_conditions, 'Original');
        await service.updateQuote(next.quoteId, 101, {...data, special_conditions: 'Nuevo acuerdo'});
        const old = await service.getQuoteById(source, 101);
        assert.equal(old.special_conditions, 'Original'); assert.equal(old.is_current, 0);
      }
    });
    await t.test('evaluation lookup resolves current conditions; general terms stay untouched', async () => {
      const source = await service.createQuote(101, {...data, evaluation_id: 101, special_conditions: 'Anterior'});
      await service.updateQuoteStatus(source, 101, 'enviada');
      const next = await service.updateQuote(source, 101, {...data, special_conditions: 'Vigente'});
      const current = await service.getQuoteByEvaluationId(101, 101);
      assert.equal(current.quote_id, next.quoteId); assert.equal(current.special_conditions, 'Vigente');
      const [[tenant]] = await pool.query('SELECT terms_conditions FROM tenants WHERE id = 101'); assert.equal(tenant.terms_conditions, tenantBefore.terms_conditions);
    });
    await t.test('tenant isolation rejects cross-tenant reads/updates', async () => {
      assert.equal(await service.getQuoteById(id, 202), null);
      assert.equal(await service.updateQuote(id, 202, {...data, special_conditions: 'Intruso'}), null);
    });
    await t.test('5,000 Unicode characters round-trip without truncation', async () => {
      const text = '🛠'.repeat(5000), quoteId = await service.createQuote(101, {...data, special_conditions: text});
      assert.equal((await service.getQuoteById(quoteId, 101)).special_conditions, text);
      await assert.rejects(service.createQuote(101, {...data, special_conditions: text + 'x'}), {code: 'INVALID_SPECIAL_CONDITIONS'});
    });
    await t.test('real Express/JWT endpoints enforce validation and isolation', async () => {
      process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
      const express = require('express'), jwt = require('jsonwebtoken');
      const app = express(); app.use(express.json()); app.use('/api/quotes', require('../src/routes/quoteRoutes'));
      const server = await new Promise(resolve => {const s = app.listen(0, '127.0.0.1', () => resolve(s));});
      try {
        const base = `http://127.0.0.1:${server.address().port}/api/quotes`;
        const headers = {'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({userId: 101, tenantId: 101}, process.env.JWT_SECRET, {expiresIn: '5m'})}`};
        const invalid = await fetch(base, {method: 'POST', headers, body: JSON.stringify({...data, special_conditions: []})}); assert.equal(invalid.status, 400);
        const result = await fetch(base, {method: 'POST', headers, body: JSON.stringify({...data, special_conditions: 'API local'})});
        assert.equal(result.status, 200); const saved = await result.json();
        const read = await fetch(`${base}/${saved.quoteId}`, {headers}); assert.equal((await read.json()).data.special_conditions, 'API local');
        const stranger = {...headers, Authorization: `Bearer ${jwt.sign({userId: 202, tenantId: 202}, process.env.JWT_SECRET, {expiresIn: '5m'})}`};
        assert.equal((await fetch(`${base}/${saved.quoteId}`, {headers: stranger})).status, 404);
        assert.equal((await fetch(base)).status, 401);
      } finally {await new Promise(resolve => server.close(resolve));}
    });
  } finally {await pool.end();}
});
