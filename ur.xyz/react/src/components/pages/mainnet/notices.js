/**
 * The notice board at the top of /mainnet (components/pages/Mainnet.jsx
 * NoticeBoard): the dated notices as a table, one row each, newest first,
 * with an Inbox and an Archived view, a row's unread mark, and its "Mark
 * read" and "Archive" buttons.
 *
 * A row opens in place to its text and link; opening it marks it read. Its
 * text stays in the HTML, closed with CSS (Mainnet.css), so a search engine
 * and a reader without script still have it, and without script every
 * notice is open and the board's buttons are hidden (the static route's
 * noscript style).
 *
 * ur.xyz has no accounts, so what a visitor has read and archived is kept in
 * this browser only (localStorage). Each entry records the notice's version,
 * a hash of its English text (noticeVersion): when a notice changes, as when
 * an update paragraph is added, it no longer matches, so the notice is
 * unread again and back in the Inbox. A browser that keeps no storage (a
 * private window, blocked site data) still works, for the visit.
 *
 * The board's state is attributes the CSS draws: the board's `data-view`
 * ("inbox" or "archived") and `data-live` (script runs), and on each notice
 * `data-open`, `data-read` and `data-archived`. One controller sets them for
 * the SPA (a React effect) and the static page alike (wireNoticeBoard), so
 * both behave the same and React holds no copy of the state.
 */

const BOARD = '.mainnet-notices';
const NOTICE = '.mainnet-notice';
const STORE_KEY = 'ur.mainnet.notices.v1';

/**
 * A short, stable hash of a notice's English title and paragraphs (FNV-1a,
 * 32 bits, in base 36): its version, which read and archived marks record.
 *
 * @param {{ title: string, paragraphs: string[] }} notice the notice as the data writes it, in English
 * @returns {string} the version, such as "1x9k2q7"
 */
export function noticeVersion(notice) {
    const text = [notice.title, ...notice.paragraphs].join('\n');
    let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(36);
}

/**
 * The visitor's marks from storage, or empty ones when there are none or
 * storage cannot be read.
 *
 * @param {Storage | null} storage where the marks are kept
 * @returns {{ read: Record<string, string>, archived: Record<string, string> }} each notice id's version when marked
 */
export function loadMarks(storage) {
    try {
        const saved = JSON.parse(storage?.getItem(STORE_KEY) || 'null');
        return {
            read: saved && typeof saved.read === 'object' ? { ...saved.read } : {},
            archived: saved && typeof saved.archived === 'object' ? { ...saved.archived } : {},
        };
    } catch {
        return { read: {}, archived: {} };
    }
}

/**
 * Keeps the marks in storage, quietly doing nothing where storage is blocked.
 *
 * @param {Storage | null} storage where the marks are kept
 * @param {{ read: object, archived: object }} marks the marks to keep
 * @returns {void}
 */
export function saveMarks(storage, marks) {
    try {
        storage?.setItem(STORE_KEY, JSON.stringify(marks));
    } catch {
        // storage full or blocked: the marks last for this visit only
    }
}

/**
 * A notice's state under the marks: archived when archived at this version,
 * read when read or archived at this version.
 *
 * @param {{ read: object, archived: object }} marks the visitor's marks
 * @param {string} id the notice's id
 * @param {string} version the notice's current version
 * @returns {{ read: boolean, archived: boolean }} the notice's state
 */
export function noticeState(marks, id, version) {
    const archived = marks.archived[id] === version;
    return { archived, read: archived || marks.read[id] === version };
}

/**
 * The notice a URL fragment points at (the notice, or anything inside it), or null.
 *
 * @param {string} hash the fragment, with or without its "#"
 * @param {Document} doc the page
 * @returns {Element | null} the notice's row group
 */
export function noticeAt(hash, doc = document) {
    let id = String(hash || '').replace(/^#/, '');
    try {
        id = decodeURIComponent(id);
    } catch {
        return null;
    }
    const target = id ? doc.getElementById(id) : null;
    return target ? target.closest(NOTICE) : null;
}

/** Whether some of the element's text is selected, so a click ended a selection. */
function selectedIn(element) {
    const selection = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
    return Boolean(selection && !selection.isCollapsed && element.contains(selection.anchorNode));
}

/** Brings a notice's row under the nav when it has scrolled away above. */
function keepInView(notice) {
    const row = notice.querySelector('.mainnet-notice-row');
    if (!row) return;
    const nav = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 0;
    if (row.getBoundingClientRect().top >= nav) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    row.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
}

/**
 * Draws one notice's state on its attributes and its toggle's aria-expanded.
 *
 * @param {Element} notice the notice's row group
 * @param {{ open?: boolean, read?: boolean, archived?: boolean }} state what to set
 * @returns {void}
 */
function drawNotice(notice, state) {
    if ('open' in state) {
        notice.toggleAttribute('data-open', state.open);
        notice.querySelector('.mainnet-notice-toggle')?.setAttribute('aria-expanded', String(state.open));
    }
    if ('read' in state) notice.toggleAttribute('data-read', state.read);
    if ('archived' in state) notice.toggleAttribute('data-archived', state.archived);
}

/**
 * Wires the notice board: draws each notice's read and archived state from
 * storage, answers the tabs, "Mark all read" and each row's buttons and
 * taps, and opens the notice the address points at (/mainnet#notice, or a
 * fragment inside one), on load and when the fragment changes.
 *
 * @param {Element | null} board the board's section (.mainnet-notices)
 * @param {Storage | null} storage where the marks are kept (localStorage by default)
 * @returns {() => void} undoes the wiring (a React effect's cleanup)
 */
export function wireNoticeBoard(board, storage = safeLocalStorage()) {
    if (!board) return () => {};
    const marks = loadMarks(storage);
    const notices = [...board.querySelectorAll(NOTICE)];
    const versionOf = (notice) => notice.getAttribute('data-version') || '';

    const setView = (view) => {
        board.setAttribute('data-view', view);
        for (const tab of board.querySelectorAll('[data-tab]')) tab.setAttribute('aria-pressed', String(tab.getAttribute('data-tab') === view));
        refresh();
    };
    const refresh = () => {
        const view = board.getAttribute('data-view');
        let unread = 0;
        let archived = 0;
        let shown = 0;
        for (const notice of notices) {
            const isArchived = notice.hasAttribute('data-archived');
            if (isArchived) archived += 1;
            else if (!notice.hasAttribute('data-read')) unread += 1;
            if (isArchived === (view === 'archived')) shown += 1;
        }
        board.querySelector('[data-count="inbox"]').textContent = unread ? String(unread) : '';
        board.querySelector('[data-count="archived"]').textContent = archived ? String(archived) : '';
        board.querySelector('.mainnet-notices-empty')?.toggleAttribute('hidden', shown > 0);
        board.querySelector('[data-act="all-read"]')?.toggleAttribute('disabled', unread === 0);
    };
    const mark = (notice, change) => {
        const id = notice.id;
        const version = versionOf(notice);
        if ('read' in change) {
            if (change.read) marks.read[id] = version;
            else delete marks.read[id];
        }
        if ('archived' in change) {
            if (change.archived) marks.archived[id] = version;
            else delete marks.archived[id];
        }
        saveMarks(storage, marks);
        drawNotice(notice, noticeState(marks, id, version));
        refresh();
    };
    const setOpen = (notice, open) => {
        drawNotice(notice, { open });
        if (open && !notice.hasAttribute('data-read')) mark(notice, { read: true });
        if (!open) keepInView(notice);
    };

    for (const notice of notices) drawNotice(notice, { open: false, ...noticeState(marks, notice.id, versionOf(notice)) });

    const onClick = (event) => {
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;
        const control = target.closest('[data-act], [data-tab]');
        const notice = target.closest(NOTICE);
        if (control?.hasAttribute('data-tab')) return setView(control.getAttribute('data-tab'));
        if (control) return act(control.getAttribute('data-act'), notice);
        if (!notice || !target.closest('.mainnet-notice-row')) return;
        if (target.closest('a[href], input, select, textarea, label') || selectedIn(notice)) return;
        setOpen(notice, !notice.hasAttribute('data-open'));
    };
    const act = (what, notice) => {
        if (what === 'all-read') {
            for (const each of notices) if (!each.hasAttribute('data-archived')) marks.read[each.id] = versionOf(each);
            saveMarks(storage, marks);
            for (const each of notices) drawNotice(each, noticeState(marks, each.id, versionOf(each)));
            return refresh();
        }
        if (!notice) return;
        if (what === 'read') return mark(notice, { read: !notice.hasAttribute('data-read') });
        if (what === 'archive') {
            const archive = !notice.hasAttribute('data-archived');
            return mark(notice, archive ? { archived: true, read: true } : { archived: false });
        }
    };
    const follow = () => {
        const notice = noticeAt(window.location.hash, board.ownerDocument);
        if (!notice) return;
        setView(notice.hasAttribute('data-archived') ? 'archived' : 'inbox');
        setOpen(notice, true);
        notice.querySelector('.mainnet-notice-row')?.scrollIntoView({ block: 'start' });
    };

    board.addEventListener('click', onClick);
    window.addEventListener('hashchange', follow);
    board.setAttribute('data-live', '');
    setView(board.getAttribute('data-view') || 'inbox');
    follow();
    return () => {
        board.removeEventListener('click', onClick);
        window.removeEventListener('hashchange', follow);
    };
}

/** The browser's localStorage, or null where reading it throws or it is absent. */
function safeLocalStorage() {
    try {
        return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
        return null;
    }
}

/**
 * The static page's board: finds it in the document and wires it.
 *
 * @param {Document} doc the page
 * @returns {void}
 */
export function wireNotices(doc = document) {
    wireNoticeBoard(doc.querySelector(BOARD));
}
