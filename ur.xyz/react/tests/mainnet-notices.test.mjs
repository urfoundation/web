// The /mainnet notice board's marks (components/pages/mainnet/notices.js):
// a notice's version, the read and archived marks kept in this browser, and a
// notice's state under them. Storage that is missing, corrupt or throws must
// never break the board; a changed notice must come back unread.
//
// Usage: node --test tests/mainnet-notices.test.mjs   (from react/; no network)
import assert from 'node:assert/strict';
import test from 'node:test';

import { loadMarks, noticeState, noticeVersion, saveMarks } from '../src/components/pages/mainnet/notices.js';
import { mainnetNotices } from '../src/data/mainnet.js';

/** An in-memory Storage, or one whose every call throws. */
function memoryStorage({ throws = false } = {}) {
    const items = new Map();
    const guard = () => { if (throws) throw new Error('SecurityError'); };
    return {
        getItem: (key) => { guard(); return items.has(key) ? items.get(key) : null; },
        setItem: (key, value) => { guard(); items.set(key, String(value)); },
        raw: items,
    };
}

test('storage that throws, is missing or holds junk gives empty marks and never throws', () => {
    assert.deepEqual(loadMarks(memoryStorage({ throws: true })), { read: {}, archived: {} });
    assert.deepEqual(loadMarks(null), { read: {}, archived: {} });
    const junk = memoryStorage();
    junk.setItem('ur.mainnet.notices.v1', '{not json');
    assert.deepEqual(loadMarks(junk), { read: {}, archived: {} });
    assert.doesNotThrow(() => saveMarks(memoryStorage({ throws: true }), { read: { a: '1' }, archived: {} }));
    assert.doesNotThrow(() => saveMarks(null, { read: {}, archived: {} }));
});

test('a notice with no marks is unread and in the inbox', () => {
    assert.deepEqual(noticeState({ read: {}, archived: {} }, 'notice', 'v1'), { read: false, archived: false });
});

test('an archived notice is also read', () => {
    assert.deepEqual(noticeState({ read: {}, archived: { notice: 'v1' } }, 'notice', 'v1'), { read: true, archived: true });
});

test('a changed notice is unread again and back in the inbox', () => {
    const marks = { read: { notice: 'v1' }, archived: { notice: 'v1' } };
    assert.deepEqual(noticeState(marks, 'notice', 'v2'), { read: false, archived: false });
});

test('marks survive a save and load', () => {
    const storage = memoryStorage();
    const marks = { read: { notice: 'abc' }, archived: { 'notice-pro-grant-cycle': 'def' } };
    saveMarks(storage, marks);
    assert.deepEqual(loadMarks(storage), marks);
});

test('a version is stable, distinct per notice, and changes when an update paragraph is added', () => {
    const versions = mainnetNotices.map(noticeVersion);
    assert.equal(new Set(versions).size, mainnetNotices.length);
    for (const notice of mainnetNotices) assert.equal(noticeVersion(notice), noticeVersion({ ...notice }));
    const notice = mainnetNotices[0];
    const updated = { ...notice, paragraphs: [...notice.paragraphs, 'Update, November 20: more news.'] };
    assert.notEqual(noticeVersion(updated), noticeVersion(notice));
    assert.match(noticeVersion(notice), /^[0-9a-z]+$/);
});
