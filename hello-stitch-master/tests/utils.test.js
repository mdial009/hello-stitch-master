// simple Node-based tests for utility functions
const assert = require('assert');
const {
  normalizeUrl,
  isESTJobsTimeAndWorkday,
  trunc,
  safeLocalStorageGet,
  sortBookmarksInManualOrder,
  isSafeBookmarkUrl,
  getFaviconUrl,
  validateBookmarkImport,
  parseBookmarkBackup,
  isValidWorkHoursConfig,
  isWithinWorkHoursAt,
  getWorkModeScheduleStatus,
  filterWorkModeColumns,
} = require('../utils');

// normalizeUrl
assert.strictEqual(normalizeUrl('https://example.com/'), 'example.com');
assert.strictEqual(normalizeUrl('http://sub.domain.net/path/'), 'sub.domain.net/path');
assert.strictEqual(normalizeUrl('ftp://notchanged'), 'ftp://notchanged');
assert.deepStrictEqual(
  sortBookmarksInManualOrder([
    { title: "Third", manualOrder: 2 },
    { title: "First", manualOrder: 0 },
    { title: "Second", manualOrder: 1 },
  ]).map((bookmark) => bookmark.title),
  ["First", "Second", "Third"]
);

// trunc
assert.strictEqual(trunc('hello', 2), 'h…');
assert.strictEqual(trunc('short', 10), 'short');

// localStorage parsing validates both JSON and the expected shape
const storedValues = new Map([['remoteFaviconsEnabled', 'false']]);
global.localStorage = {
  getItem: (key) => storedValues.get(key) ?? null,
};
assert.strictEqual(safeLocalStorageGet('missing', [], Array.isArray).length, 0);
assert.strictEqual(
  safeLocalStorageGet('remoteFaviconsEnabled', true, (value) => typeof value === 'boolean'),
  false
);
assert.strictEqual(getFaviconUrl('https://example.com/path'), '');
assert.strictEqual(isSafeBookmarkUrl('JAVASCRIPT:alert(1)'), false);
assert.strictEqual(isSafeBookmarkUrl('https://example.com'), true);
storedValues.set('remoteFaviconsEnabled', 'true');
assert.strictEqual(
  getFaviconUrl('https://example.com/path'),
  'https://www.google.com/s2/favicons?domain=example.com&sz=32'
);

// Backup validation rejects malformed folders and executable URLs before import.
const validImport = validateBookmarkImport([{
  title: 'Projects',
  children: [{
    title: 'Example',
    url: 'https://example.com/',
    path: ['Projects', 'Dev'],
    id: 'untrusted-source-id',
  }],
}]);
assert.deepStrictEqual(validImport, [{
  title: 'Projects',
  children: [{
    title: 'Example',
    url: 'https://example.com/',
    path: ['Projects', 'Dev'],
  }],
}]);
assert.throws(
  () => validateBookmarkImport([{ title: '/', children: [{ title: 'Bad', url: 'javascript:alert(1)' }] }]),
  /scheme/
);
assert.throws(() => validateBookmarkImport([{ title: 'Missing children' }]), /invalid format/);
const versionedBackup = parseBookmarkBackup({
  format: "hello-stitch-bookmarks",
  version: 1,
  bookmarks: [{
    title: "Folder",
    children: [
      { title: "Second", url: "https://second.example/", manualOrder: 1 },
      { title: "First", url: "https://first.example/", manualOrder: 0 },
    ],
  }],
});
assert.deepStrictEqual(versionedBackup.bookmarks[0].children.map((bookmark) => bookmark.title), ["First", "Second"]);
assert.strictEqual(versionedBackup.isFullBackup, false);
const fullBackup = parseBookmarkBackup({
  format: "hello-stitch-full-backup",
  version: 1,
  bookmarks: [{ title: "/", children: [] }],
  settings: { selectedTheme: "matrix" },
});
assert.deepStrictEqual(fullBackup.settings, { selectedTheme: "matrix" });
assert.strictEqual(fullBackup.isFullBackup, true);
assert.throws(() => parseBookmarkBackup({
  format: "hello-stitch-full-backup",
  version: 2,
  bookmarks: [],
  settings: {},
}), /supported/);
assert.throws(() => parseBookmarkBackup({
  format: "hello-stitch-full-backup",
  version: 1,
  bookmarks: [],
  settings: { selectedTheme: 7 },
}), /invalid settings/);
assert.strictEqual(isValidWorkHoursConfig({
  startTime: '08:00',
  endTime: '16:00',
  days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
}), true);
assert.strictEqual(isValidWorkHoursConfig({ startTime: '25:00', endTime: '16:00', days: {} }), false);
assert.strictEqual(isValidWorkHoursConfig({
  startTime: '16:00',
  endTime: '08:00',
  days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
}), false);
assert.strictEqual(isValidWorkHoursConfig({
  startTime: '08:00',
  endTime: '08:00',
  days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
}), false);

const easternWeekdays = {
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
  sat: false,
  sun: false,
};
const easternHours = { startTime: '08:00', endTime: '16:00', days: easternWeekdays };
assert.strictEqual(isWithinWorkHoursAt(easternHours, new Date('2026-10-15T12:00:00Z')), true);
assert.strictEqual(isWithinWorkHoursAt(easternHours, new Date('2026-10-15T11:59:00Z')), false);
assert.strictEqual(isWithinWorkHoursAt(easternHours, new Date('2026-10-15T20:00:00Z')), false);
assert.strictEqual(isWithinWorkHoursAt(easternHours, new Date('2026-01-15T13:00:00Z')), true);
assert.strictEqual(isWithinWorkHoursAt(easternHours, new Date('2026-10-16T19:59:00Z')), true);
assert.strictEqual(isWithinWorkHoursAt({
  ...easternHours,
  days: { ...easternWeekdays, fri: false },
}, new Date('2026-10-16T19:59:00Z')), false);
assert.strictEqual(
  getWorkModeScheduleStatus(true, 0, easternHours, new Date('2026-10-15T12:00:00Z')),
  'Select at least one work folder'
);
assert.strictEqual(
  getWorkModeScheduleStatus(true, 1, { ...easternHours, days: Object.fromEntries(Object.keys(easternWeekdays).map((day) => [day, false])) }, new Date('2026-10-15T12:00:00Z')),
  'Choose at least one active day'
);
assert.strictEqual(
  getWorkModeScheduleStatus(true, 1, easternHours, new Date('2026-10-15T12:00:00Z')),
  'Active until 4:00 PM ET'
);
assert.strictEqual(
  getWorkModeScheduleStatus(true, 1, easternHours, new Date('2026-10-15T11:00:00Z')),
  'Next active Today at 8:00 AM ET'
);
assert.strictEqual(
  getWorkModeScheduleStatus(true, 1, easternHours, new Date('2026-10-15T21:00:00Z')),
  'Next active Friday at 8:00 AM ET'
);

const parentBookmark = { id: 'bookmark-1', title: 'Project', url: 'https://example.com', path: ['Work', 'Projects'] };
const distinctDuplicateUrl = { id: 'bookmark-2', title: 'Project copy', url: 'https://example.com', path: ['Work'] };
assert.deepStrictEqual(
  filterWorkModeColumns([
    { title: 'Work', children: [parentBookmark, distinctDuplicateUrl] },
    { title: 'Personal', children: [{ id: 'bookmark-3', title: 'Other', url: 'https://other.example', path: ['Personal'] }] },
  ], ['Work', 'Work / Projects']).map((column) => ({
    title: column.title,
    ids: column.children.map((bookmark) => bookmark.id),
  })),
  [{ title: 'Work', ids: ['bookmark-1', 'bookmark-2'] }]
);

// isESTJobsTimeAndWorkday can't be reliably asserted without mocking date, but ensure it returns a boolean
assert.strictEqual(typeof isESTJobsTimeAndWorkday(), 'boolean');

console.log('utils tests passed');
