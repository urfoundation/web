/**
 * How the research report finds its glossary terms in a translation
 * (components/pages/research-report/model.js termMatchers): the first use of a
 * term in each entry links to its definition.
 *
 * The English patterns (model.js TERM_PATTERNS) find the names and acronyms,
 * which every translation keeps as they are (ACK, H1+, PERFVAR, gVisor, cwnd).
 * The terms that are words are written in each language's own words, so each
 * translation gives its patterns here, by term id; terms.test.mjs checks that
 * each one finds the translation's glossary name and its uses in the text.
 * Patterns use the u flag; a Cyrillic or Latin word's edges are lookarounds,
 * since \b only knows ASCII.
 */
export const TERM_PATTERNS_BY_LANG = {
    ru: {
        'g-goroutine': /(?<![\p{L}\p{N}])горутин\p{L}*/iu,
        'g-ios-profile': /(?<![\p{L}\p{N}])(?:профил|заменител)\p{L}* iOS(?![\p{L}\p{N}])/iu,
        'g-model-mbps': /(?<![\p{L}\p{N}])модельн\p{L}* Mbps/iu,
        'g-pacing': /(?<![\p{L}\p{N}])пейсинг\p{L}*/iu,
        'g-race-mode': /(?<![\p{L}\p{N}])режим\p{L}* race(?![\p{L}\p{N}])/iu,
        'g-websocket-masking': /(?<![\p{L}\p{N}])маскировани\p{L}*(?: WebSocket)?/iu,
    },
    // Arabic attaches prepositions and the article to a word (لضبط، بوضع), so a term is found inside one
    ar: {
        'g-ack-compression': /ضغط ACK/u,
        'g-ios-profile': /(?:ملفات? تعريف|بديلة? لـ ?) ?iOS/u,
        'g-model-mbps': /Mbps في النموذج/u,
        'g-pacing': /ضبط ال?إيقاع/u,
        'g-race-mode': /وضع race/u,
        'g-websocket-masking': /(?:ال)?تقنيع(?: WebSocket)?/u,
    },
    zh: {
        'g-ack-compression': /ACK ?压缩/u,
        'g-ios-profile': /iOS ?(?:替代)?配置/u,
        'g-model-mbps': /模型 ?Mbps/u,
        'g-pacing': /节奏控制/u,
        'g-race-mode': /race ?(?:模式|诊断|检测)/u,
        'g-websocket-masking': /(?:WebSocket ?)?掩码/u,
    },
    de: {
        'g-goroutine': /\bGoroutinen?\b/u,
        'g-ios-profile': /\biOS-(?:Profil|Ersatz)\b/u,
        'g-model-mbps': /\bModell-Mbps\b/u,
        'g-race-mode': /\bRace-(?:Modus|Diagnose|Bestätigungen?)\b/u,
        'g-websocket-masking': /\b(?:WebSocket-)?Maskierung\b/u,
    },
    es: {
        'g-ios-profile': /(?<![\p{L}\p{N}])(?:perfil|sustituto) de iOS(?![\p{L}\p{N}])/iu,
        'g-model-mbps': /(?<![\p{L}\p{N}])Mbps del modelo(?![\p{L}\p{N}])/iu,
        'g-pacing': /(?<![\p{L}\p{N}])espaciado(?![\p{L}\p{N}])/iu,
        'g-race-mode': /(?<![\p{L}\p{N}])(?:modo|diagnóstico) race(?![\p{L}\p{N}])/iu,
        'g-websocket-masking': /(?<![\p{L}\p{N}])enmascaramiento(?: de WebSocket)?(?![\p{L}\p{N}])/iu,
    },
};
