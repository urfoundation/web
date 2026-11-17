/**
 * Copy with an element inside it: a translated sentence whose {name}
 * placeholder is a link or a code span, not text. parts(template, 'link')
 * gives the text before and after the placeholder, so the element can sit
 * where each language puts it ([template, ''] when the template has none).
 */
export function parts(template, name) {
    const token = `{${name}}`;
    const at = template.indexOf(token);
    return at < 0 ? [template, ''] : [template.slice(0, at), template.slice(at + token.length)];
}
