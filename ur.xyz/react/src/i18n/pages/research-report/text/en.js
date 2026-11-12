// The research report's text (/research/2026-q3-report), which only the static
// page renders: the plain layer written over the report and the layer that
// scripts/research-report-import.mjs quotes from it, both derived from the
// report data (../english.js).
import data from '../../../../data/research-report-2026-q3.json' with { type: 'json' };
import { textEnglish } from '../english.js';

export default textEnglish(data);
