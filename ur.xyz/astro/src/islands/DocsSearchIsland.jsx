/**
 * The docs search box, the one part of the static docs chrome
 * (components/DocsShell.astro) that hydrates (client:idle). It renders what
 * the SPA's Explorer renders for search: the input and, while there is a
 * query, the results in place of the sidebar's list, which it hides.
 *
 * The index is /docs-search.json, fetched the first time the box is focused or
 * typed in, so a page that is only read never loads it: the docs pages used to
 * bundle the whole corpus to search it. A translated page passes its own
 * language's index (/docs-search.<lang>.json, its translations' text) and the
 * box's words from the docs copy (react/src/i18n/pages/docs/).
 */
import React, { useEffect, useRef, useState } from 'react';
import { searchDocs } from '@react/lib/docs-search.js';

const ENGLISH = { placeholder: 'Search docs', label: 'Search docs', results: 'Search results', none: 'No matches.', kind: 'DOC' };

export default function DocsSearchIsland({ indexUrl = '/docs-search.json', labels = ENGLISH }) {
    const [query, setQuery] = useState('');
    const [index, setIndex] = useState(null);
    const loading = useRef(null);

    const load = () => {
        if (loading.current) return;
        loading.current = fetch(indexUrl)
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${indexUrl}: ${res.status}`))))
            .then(setIndex)
            .catch(() => {
                // try again on the next keystroke
                loading.current = null;
            });
    };

    // until the index arrives a query shows nothing rather than "No matches."
    const results = index ? searchDocs(index, query) : null;

    // the results take the place of the static list, as in the SPA
    useEffect(() => {
        const list = document.querySelector('#explorer-sidebar .explorer-nav');
        if (list) list.hidden = Boolean(results);
    }, [results]);

    return (
        <>
            <div className="explorer-search">
                <input
                    type="search"
                    className="explorer-search-input"
                    placeholder={labels.placeholder}
                    value={query}
                    onFocus={load}
                    onChange={(e) => {
                        load();
                        setQuery(e.target.value);
                    }}
                    aria-label={labels.label}
                />
            </div>

            {results && (
                <div className="explorer-results" role="listbox" aria-label={labels.results}>
                    {results.length === 0 && (
                        <div className="explorer-results-empty">{labels.none}</div>
                    )}
                    {results.map((r, i) => (
                        <button
                            key={`${r.slug}:${i}`}
                            type="button"
                            className="explorer-result"
                            onClick={() => window.location.assign(r.href)}
                        >
                            <span className="explorer-result-kind kind-doc">{labels.kind}</span>
                            <span className="explorer-result-body">
                                <span className="explorer-result-title">{r.title}</span>
                                {r.subtitle && (
                                    <span className="explorer-result-subtitle">{r.subtitle}</span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
