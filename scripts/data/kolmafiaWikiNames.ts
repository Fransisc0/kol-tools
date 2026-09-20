import type { SourceItem } from './dataOfLoathing';

/** KoLmafia has a few Wiki Name modifiers keyed by alternate item aliases absent from DoL. */
export function enrichMissingWikiNames(
  items: ReadonlyMap<number, SourceItem>,
  modifierSource: string,
): ReadonlyMap<number, SourceItem> {
  const wikiNames = new Set<string>();
  for (const line of modifierSource.split(/\r?\n/)) {
    if (!line.startsWith('Item\t')) continue;
    const fields = line.split('\t');
    const match = fields[2]?.match(/(?:^|, )Wiki Name: "([^"]+)"(?:,|$)/);
    if (match) wikiNames.add(match[1]);
  }
  const enriched = new Map<number, SourceItem>();
  for (const [id, item] of items) {
    const hasWikiName = item.modifiers.some(({ name }) => name === 'Wiki Name');
    if (hasWikiName || !wikiNames.has(item.name)) {
      enriched.set(id, item);
      continue;
    }
    enriched.set(id, {
      ...item,
      modifiers: [...item.modifiers, { name: 'Wiki Name', value: `"${item.name}"` }],
    });
  }
  return enriched;
}
