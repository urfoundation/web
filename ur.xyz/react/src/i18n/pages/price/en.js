// /price, the published price sheet: the text of the page's head
// (astro/src/components/routes/PriceRoute.astro). The page's body is the site
// dictionaries' `price` section (react/src/i18n/<lang>.js, PriceSection.jsx),
// and its meta description is that section's intro; the sheet's figures come
// from price/price.yml and are never translated.
export default {
    meta: {
        // the page's <title>: at most 60 characters
        title: 'Usage cost | The published price of the UR network',
        // the name of the page's dataset in its structured data (schema.org Dataset)
        datasetName: 'UR network usage cost: the published rate sheet',
        // the title of the RSS feed of price changes, as browsers and feed readers list it
        feedTitle: 'UR usage cost',
    },
};
