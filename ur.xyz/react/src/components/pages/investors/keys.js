// How the investors copy (react/src/i18n/pages/investors/) keys what the
// registry (react/src/data/investors.js) names: the copy's English derives its
// keys with these, and the components look strings up with them.

// A category's key: "Management Update" → managementUpdate.
export const categoryKey = (category) =>
    category.toLowerCase().replace(/ (\w)/g, (_, c) => c.toUpperCase());

// A document's key: the last segment of its address
// (/investors/conviction-lock → conviction-lock, /docs/litepaper → litepaper).
export const documentKey = (href) => href.split('/').pop();

// A kind's key: "Announcement" → announcement.
export const kindKey = (kind) => kind.toLowerCase();
