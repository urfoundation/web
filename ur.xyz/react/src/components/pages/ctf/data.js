/**
 * The capture the flag model of this build's snapshot (data/ctf-epoch.json),
 * shared by the pages and their islands: the islands bundle the snapshot, so
 * they hydrate on exactly the data the page was rendered from.
 */
import snapshot from '../../../data/ctf-epoch.json';
import { buildModel } from './model';

export const CTF = buildModel(snapshot);
