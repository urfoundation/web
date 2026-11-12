// The docs corpus in translation (corpus.mjs), in the gates: every translation
// follows its English block for block, keeps its code, inline code, link
// targets and figures exactly, and was accepted against the current English.
// While the docs page group is not localized a translation may be missing, but
// every one that exists is checked; once it is localized, every published
// document needs all five.
//
// When this fails after an English edit: update each language's translation of
// the blocks it names (`node corpus.mjs --todo <lang> <doc>` prints the English
// that changed), then `node corpus.mjs --accept all <doc>`.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { LANGS, checkTranslation, compareDocument, corpusDocs, translationPath } from './corpus.mjs';
import * as routes from '../../../../../astro/src/lib/route-localization.js';

test('every docs translation matches its English and is current', () => {
    const localized = routes.PAGE_GROUPS?.docs?.localized === true;
    const problems = [];
    for (const lang of LANGS) {
        for (const rel of corpusDocs()) {
            if (!localized && !fs.existsSync(translationPath(lang, rel))) continue;
            for (const p of checkTranslation(lang, rel)) problems.push(`${lang} ${rel}: ${p}`);
        }
    }
    assert.deepEqual(problems, [], `\n${problems.join('\n')}\n(react/src/i18n/pages/docs/corpus.mjs explains each)`);
});

const ENGLISH = `---
description: Run the miner on port 443 in 3 steps.
---

# Run it

Start it with \`provider start\`, then see [the guide](/docs/miner#quick-start).

\`\`\`bash
provider start
\`\`\`

- start the miner on this host
- two
`;

test('a faithful translation passes', () => {
    const ru = `---
description: Запустите майнер на порту 443 за 3 шага.
---

# Запуск

Запустите его командой \`provider start\`, затем см. [руководство](/docs/miner#quick-start).

\`\`\`bash
provider start
\`\`\`

- запустите майнер на этом хосте
- два
`;
    assert.deepEqual(compareDocument(ENGLISH, ru, 'miner/run.md', 'ru'), []);
});

test('a changed code block, a lost inline code span, link target or figure, and English left in are caught', () => {
    const ru = `---
description: Запустите майнер на порту 433 за 3 шага.
---

# Запуск

Запустите его, затем см. [руководство](/docs/miner).

\`\`\`bash
provider start --verbose
\`\`\`

- start the miner on this host!
- два
`;
    const problems = compareDocument(ENGLISH, ru, 'miner/run.md', 'ru').join('\n');
    assert.match(problems, /number\(s\) missing: 443/);
    assert.match(problems, /inline code missing: "`provider start`"/);
    assert.match(problems, /link target missing: "\/docs\/miner#quick-start"/);
    assert.match(problems, /code block differs from the English/);
    assert.match(problems, /no ru text/);
});

test('a merged paragraph puts the blocks out of step and stops there', () => {
    const ru = `# Запуск

Запустите его командой \`provider start\`, затем см. [руководство](/docs/miner#quick-start). \`\`\`bash provider start\`\`\`
`;
    const problems = compareDocument(ENGLISH.replace(/^---[\s\S]*?---\n/, ''), ru, 'miner/run.md', 'ru');
    assert.ok(problems.some((p) => /the English has a code block .*, the translation a|the English has \d+ blocks, the translation \d+/.test(p)), problems.join('\n'));
});
