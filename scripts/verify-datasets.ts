import { clearTCRSCaches, parseTCRSFile } from '../server/tcrsParser';
import { CLASSES, MOON_SIGNS } from '../src/data/constants';

let verified = 0;

for (const characterClass of CLASSES) {
  for (const moonSign of MOON_SIGNS) {
    const data = await parseTCRSFile(characterClass.id, moonSign.id);
    if (data.className !== characterClass.id || data.moonSign !== moonSign.id) {
      throw new Error(`Unexpected identity for ${characterClass.id}/${moonSign.id}`);
    }
    if (data.allItems.length === 0) {
      throw new Error(`No items parsed for ${characterClass.id}/${moonSign.id}`);
    }
    verified += 1;
  }
}

clearTCRSCaches();
console.log(`Verified ${verified} bundled class/sign combinations.`);
