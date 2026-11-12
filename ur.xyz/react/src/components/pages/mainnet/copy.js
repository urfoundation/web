/**
 * /mainnet's data in one language: the milestones of data/mainnet-timeline.json
 * and the notices, the box at the top and the epochs of data/mainnet.js, with
 * their words from the page's copy units (i18n/pages/mainnet/timeline and
 * i18n/pages/mainnet/data, as page-copy.js loads them for the language). Their
 * dates, statuses, refs and links stay the data's in every language, and the
 * notices keep the order they are given in: mainnetNotices, newest first, the
 * order the data sorts them in, so every language shows them alike.
 *
 * Pure, so the page (Mainnet.jsx), the static route that hands its island the
 * summary's model, and the node tests share it.
 */
import { interpolate } from '../../../i18n/format.js';
import { noticeDay } from '../../../data/mainnet.js';
import EN from '../../../i18n/pages/mainnet/en.js';

/** The milestones with the words of `tt` (the timeline unit): each one's title, detail and sources' labels. */
export function localizeEvents(events, tt) {
    return events.map((event) => {
        const words = tt?.events?.[event.id];
        if (!words) return event;
        return {
            ...event,
            title: words.title ?? event.title,
            detail: words.detail ?? event.detail,
            sources: event.sources.map((source, i) => ({ ...source, label: words.sources?.[i] ?? source.label })),
        };
    });
}

/** The day a notice was posted, as `t` writes a date (dates.long): "October 31, 2026", "31 октября 2026 г.". */
export function noticeDate(notice, t = EN) {
    const day = new Date(noticeDay(notice));
    return interpolate(t.dates.long, { month: t.dates.monthsLong[day.getUTCMonth()], date: day.getUTCDate(), year: day.getUTCFullYear() });
}

/**
 * The notices in the order given, with the words of `d` (the data unit) and
 * their dates as `t` writes them (`dateText`).
 */
export function localizeNotices(notices, d, t = EN) {
    return notices.map((notice) => {
        const words = d?.notices?.[notice.id] || {};
        return {
            ...notice,
            title: words.title ?? notice.title,
            paragraphs: notice.paragraphs.map((paragraph, i) => words.paragraphs?.[i] ?? paragraph),
            link: { ...notice.link, label: words.link ?? notice.link.label },
            dateText: noticeDate(notice, t),
        };
    });
}

/**
 * The box at the top with the words of `d`: its headline, title and steps,
 * and its closing paragraph as a template whose {link1}, {link2}, … are its
 * links, in the data's order, each { text, href }.
 */
export function localizeActions(actions, d) {
    const words = d?.actions || {};
    const linked = actions.closing.filter((run) => run.href);
    return {
        headline: words.headline ?? actions.headline,
        title: words.title ?? actions.title,
        steps: actions.steps.map((step, i) => {
            const own = words.steps?.[i] || {};
            return {
                ...step,
                title: own.title ?? step.title,
                detail: own.detail ?? step.detail,
                ...(step.link ? { link: { ...step.link, label: own.link ?? step.link.label } } : {}),
            };
        }),
        closing: words.closing ?? actions.closing.map((run) => (run.href ? `{link${linked.indexOf(run) + 1}}` : run.text)).join(''),
        links: linked.map((run, i) => ({ text: words.closingLinks?.[i] ?? run.text, href: run.href })),
    };
}

/** The epochs with the words of `d`: what each one is (its `summary`). */
export function localizeEpochs(epochs, d) {
    return epochs.map((epoch) => ({ ...epoch, summary: d?.epochs?.[epoch.number] ?? epoch.summary }));
}
