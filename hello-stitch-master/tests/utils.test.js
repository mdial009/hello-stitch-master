// simple Node-based tests for utility functions
const assert = require('assert');
const {
  normalizeUrl,
  isESTJobsTimeAndWorkday,
  trunc,
  showWorkModeModal,
} = require('../utils');

// normalizeUrl
assert.strictEqual(normalizeUrl('https://example.com/'), 'example.com');
assert.strictEqual(normalizeUrl('http://sub.domain.net/path/'), 'sub.domain.net/path');
assert.strictEqual(normalizeUrl('ftp://notchanged'), 'ftp://notchanged');

// trunc
assert.strictEqual(trunc('hello', 2), 'h…');
assert.strictEqual(trunc('short', 10), 'short');

// isESTJobsTimeAndWorkday can't be reliably asserted without mocking date, but ensure it returns a boolean
assert.strictEqual(typeof isESTJobsTimeAndWorkday(), 'boolean');

console.log('utils tests passed');
