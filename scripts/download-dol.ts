import path from 'node:path';

import { downloadDataOfLoathing } from './data/currentSources';

const destination = path.resolve(process.argv[2] ?? '.staged-data/dol.sqlite');
const etagFile = path.resolve(process.argv[3] ?? '.staged-data/dol.etag');
await downloadDataOfLoathing(destination, etagFile);
console.log('Downloaded bounded, current Data of Loathing input.');
