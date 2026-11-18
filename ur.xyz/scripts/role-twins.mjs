/**
 * The markdown twins of the home page and the three role pages (/index.md,
 * /miners.md, /validators.md, /operators.md), from the site's English
 * dictionary (react/src/i18n/en.js): the same words the pages render, in the
 * order they render them. Links are absolute, as in every twin.
 */

const SITE = "https://ur.xyz";
const ROLES = ["operators", "miners", "validators"];

const abs = (href) => (/^https?:\/\//.test(href) ? href : `${SITE}${href}`);
const link = (l) => (l ? ` [${l.label}](${abs(l.href)})` : "");

function guideBlock(block, level = 2) {
  if (!block) return [];
  const h = "#".repeat(level);
  return [
    `${h} ${block.title}`,
    ...block.items.flatMap((item) => [`${h}# ${item.title}`, `${item.body}${link(item.link)}`]),
    ...(block.compared?.links?.length
      ? [`${block.compared.label}: ${block.compared.links.map((l) => `[${l.label}](${abs(l.href)})`).join(", ")}`]
      : []),
  ];
}

function guides(t) {
  const g = t.roleGuides;
  return [
    `## ${g.title}`,
    [
      `- [${g.miner}](${SITE}/docs/miner) ([markdown](${SITE}/docs-md/miner.md))`,
      `- [${g.rewards}](${SITE}/docs/miner/rewards) ([markdown](${SITE}/docs-md/miner/rewards.md))`,
      `- [${g.validator}](${SITE}/docs/validator) ([markdown](${SITE}/docs-md/validator.md))`,
      `- [${g.operator}](${SITE}/docs/operator) ([markdown](${SITE}/docs-md/operator.md))`,
      `- [${g.litepaper}](${SITE}/docs/litepaper) ([markdown](${SITE}/litepaper.md))`,
    ].join("\n"),
  ];
}

const doc = (url, title, parts) => `# ${title}\n\nSource: ${url}\n\n${parts.filter(Boolean).join("\n\n")}\n`;

export function roleTwins(t) {
  const out = {};
  const home = t.homepage;
  out["index.md"] = doc(`${SITE}/`, home.metaTitle, [
    home.intro,
    `## ${home.rolesTitle}`,
    ...ROLES.flatMap((r) => [`### ${home.roles[r].name}`, `${home.roles[r].body} [${home.roles[r].explore}](${SITE}/${r}) ([markdown](${SITE}/${r}.md))`]),
    ...guides(t),
  ]);
  for (const r of ROLES) {
    const s = t[r];
    out[`${r}.md`] = doc(`${SITE}/${r}`, s.title, [
      s.intro,
      s.both,
      s.goal,
      ...s.roles.flatMap((c) => [`## ${c.title}`, `${c.body}${c.href ? link({ label: c.linkLabel, href: c.href }) : ""}`]),
      ...guideBlock(s.guide),
      ...guideBlock(s.scoring),
      ...guides(t),
    ]);
  }
  return out;
}
