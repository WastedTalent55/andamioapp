const crypto = require('node:crypto');

const RUNNER_PREFIX = 'andamio_cc_';
const MYSQL_USER_MAX_LENGTH = 32;

function createRunnerUsername(randomBytes = crypto.randomBytes) {
  // 16 hex characters provide 64 bits of randomness; total username length is 27.
  const username = RUNNER_PREFIX + randomBytes(8).toString('hex');
  validateRunnerUsername(username);
  return username;
}

function validateRunnerUsername(username) {
  if (!isValidRunnerUsername(username)) {
    throw new Error('Generated MySQL test username is invalid or exceeds 32 characters');
  }
  return username;
}

function isValidRunnerUsername(username) {
  return typeof username === 'string' && username.length <= MYSQL_USER_MAX_LENGTH &&
    /^andamio_cc_[a-f0-9]{16}$/.test(username);
}

module.exports = {createRunnerUsername, validateRunnerUsername, isValidRunnerUsername, MYSQL_USER_MAX_LENGTH};
