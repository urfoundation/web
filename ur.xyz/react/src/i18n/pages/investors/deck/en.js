// The investor deck's page (/investors/deck): components/pages/investors/
// DeckViewer.jsx. What each slide says derives from the registry
// (react/src/data/investors.js, deck.slides, transcribed from the deck), which
// stays the source; the slides themselves and the PDF are the English deck.
// The deck's title and summary are the group's (../en.js, docs.deck).
import { investorCentre } from '../../../../data/investors.js';

export default {
    // {count} slides, in the heading's meta line
    slideCount: {
        zero: '{count} slides',
        one: '{count} slide',
        two: '{count} slides',
        few: '{count} slides',
        many: '{count} slides',
        other: '{count} slides',
    },
    previous: 'Previous slide',
    next: 'Next slide',
    fullscreen: 'Fullscreen',
    pdf: 'PDF',
    jumpAria: 'Jump to slide',
    // a filmstrip button's accessible name
    thumbAria: 'Slide {n}: {title}',
    // a slide the registry has not transcribed yet
    untitledSlide: 'Slide {n}',
    untitledAlt: 'Slide {n} of {total}',
    // <kbd> marks a key, <sep> the dot between the two hints
    hint: '<kbd>←</kbd> <kbd>→</kbd> to move <sep>·</sep> <kbd>F</kbd> fullscreen',
    outlineHeading: 'In this deck',
    outlineHint: 'Every slide as text',
    slides: investorCentre.deck.slides.map(({ title, headline, alt, summary }) => ({ title, headline, alt, summary })),
};
