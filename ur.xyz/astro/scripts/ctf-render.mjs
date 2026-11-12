// Capture the flag's country page as the site renders it, for the seo-audit:
// react/src/components/pages/CtfCountry.jsx loaded through Vite's SSR (it is
// JSX, with its stylesheet and the copy's per-language modules) with React's
// server renderer, so the audit decides each page's indexing with the same
// component and the same function as the build (astro/src/components/routes/
// ctf-paths.js, react/src/components/pages/ctf/indexing.js). The model, the
// decision and the component are all Vite's modules, one instance each.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REACT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../react');

/**
 * { CTF, indexing, render, close }: the snapshot's model (ctf/data.js), the
 * indexing module, render({ code, lang, model }) → the HTML of the page's
 * <main>, and close() to stop Vite.
 */
export async function ctfRenderer() {
    const require = createRequire(path.join(REACT, 'package.json'));
    const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
    const React = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const server = await createServer({
        root: REACT,
        configFile: path.join(REACT, 'vite.config.js'),
        logLevel: 'error',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false, watch: null },
    });
    try {
        const { default: CtfCountryPage } = await server.ssrLoadModule('/src/components/pages/CtfCountry.jsx');
        const { CTF } = await server.ssrLoadModule('/src/components/pages/ctf/data.js');
        const indexing = await server.ssrLoadModule('/src/components/pages/ctf/indexing.js');
        const render = ({ code, lang, model }) => renderToStaticMarkup(React.createElement(CtfCountryPage, { code, lang, model, updated: '__UR_PAGE_LASTMOD__' }));
        return { CTF, indexing, render, close: () => server.close() };
    } catch (error) {
        await server.close();
        throw error;
    }
}
