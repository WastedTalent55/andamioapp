const test = require('node:test');
const assert = require('node:assert/strict');
const {createRunnerUsername, validateRunnerUsername, isValidRunnerUsername, MYSQL_USER_MAX_LENGTH} = require('./local-concurrency-setup-utils.cjs');

test('runner username generator stays within MySQL limit and retains 64 random bits', () => {
  const username = createRunnerUsername(() => Buffer.from('0123456789abcdef', 'hex'));
  assert.equal(username, 'andamio_cc_0123456789abcdef');
  assert.equal(username.length, 27);
  assert.ok(username.length <= MYSQL_USER_MAX_LENGTH);
  assert.equal(validateRunnerUsername(username), username);
  assert.equal(isValidRunnerUsername(username), true);
});

test('runner username validation rejects overlong and malformed names', () => {
  assert.throws(() => validateRunnerUsername('andamio_concurrency_runner_0123456789abcdef'), /exceeds 32 characters/);
  assert.throws(() => validateRunnerUsername('andamio_cc_not-hex-1234'), /invalid/);
});
