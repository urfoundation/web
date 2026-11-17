// Refuses to build ur.xyz while a before-the-flip placeholder is unfilled.
//
// The miner docs name the fleet runtime authority document's link and SHA-256, which
// exist only once the owner approves them. Each has a place held by a token of the
// form __BEFORE_FLIP_<NAME>__. A token in a published doc would send a miner to a
// command that fails, so the build stops instead: astro.config.mjs calls this on the
// docs corpus it publishes.

const TOKEN = /__BEFORE_FLIP_[A-Z0-9_]+__/g;

// Every token in the given [{ path, content }], as { path, token }, one row per
// distinct pair.
export function unfilledPlaceholders(docs) {
    const out = [];
    for (const { path, content } of docs) {
        for (const token of new Set(content.match(TOKEN) ?? [])) out.push({ path, token });
    }
    return out;
}

export function assertNoUnfilledPlaceholders(docs) {
    const found = unfilledPlaceholders(docs);
    if (found.length > 0) {
        throw new Error(`unfilled placeholder(s); ur.xyz can't ship with these:\n${found.map(({ path, token }) => `  docs/${path}: ${token}`).join('\n')}`);
    }
}
