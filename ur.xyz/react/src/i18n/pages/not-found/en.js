// The not-found page (astro/src/components/routes/NotFoundRoute.astro): what a
// visitor sees at a missing address, /404.html in English and /<lang>/404.html
// in each translation (nginx serves it for a miss under /<lang>/).
export default {
    meta: {
        // the page's <title>: at most 60 characters (the page is never indexed)
        title: 'Page not found — UR',
        // the meta description: at most 175 characters
        description: 'This page does not exist.',
    },
    // the page's h1
    title: 'This page does not exist.',
    // the line under it
    lede: 'The link may be out of date, or the page may have moved.',
    // the link to the home page of the page's language
    home: 'Back to home',
};
