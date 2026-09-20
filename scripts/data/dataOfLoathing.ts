import { DatabaseSync } from 'node:sqlite';

export interface SourceModifier {
  name: string;
  value: string;
}

export interface SourceItem {
  id: number;
  name: string;
  image: string;
  uses: string[];
  modifiers: SourceModifier[];
  stomach: number;
  liver: number;
  spleen: number;
  quality: string | null;
  adventures: number | null;
  notes: string;
}

export interface SourceEffect {
  id: number;
  name: string;
  quality: string;
  noHookah: boolean;
  notTcrs: boolean;
  ambiguous: boolean;
  modifiers: SourceModifier[];
}

export interface DataOfLoathingSnapshot {
  items: ReadonlyMap<number, SourceItem>;
  effects: readonly SourceEffect[];
  lastUpdate: number;
  lastRevision: number;
}

function parseJsonArray<T>(value: string | null): T[] {
  const parsed: unknown = JSON.parse(value ?? '[]');
  if (!Array.isArray(parsed)) throw new Error('Data of Loathing contains an invalid JSON array.');
  return parsed as T[];
}

/** Read only the Data of Loathing fields needed by the derivation; never execute database content. */
export function readDataOfLoathing(filename: string): DataOfLoathingSnapshot {
  const database = new DatabaseSync(filename, { readOnly: true });
  try {
    const meta = database.prepare('SELECT last_update, last_revision FROM meta LIMIT 1').get() as
      | { last_update: number; last_revision: number }
      | undefined;
    if (!meta || !Number.isSafeInteger(meta.last_update) || !Number.isSafeInteger(meta.last_revision)) {
      throw new Error('Data of Loathing version metadata is missing.');
    }

    const items = new Map<number, SourceItem>();
    const itemRows = database
      .prepare(
        `SELECT i.id, i.name, i.image, i.uses, im.modifiers,
                c.stomach, c.liver, c.spleen, c.quality, c.adventures, c.notes
         FROM items AS i
         LEFT JOIN itemModifiers AS im ON im.item = i.id
         LEFT JOIN consumables AS c ON c.id = i.id
         ORDER BY i.id`,
      )
      .all() as Array<Record<string, unknown>>;

    for (const row of itemRows) {
      const id = Number(row.id);
      if (!Number.isSafeInteger(id) || id <= 0 || typeof row.name !== 'string') {
        throw new Error('Data of Loathing contains an invalid item.');
      }
      const uses = parseJsonArray<string>(row.uses as string);
      const modifiers = parseJsonArray<SourceModifier>(row.modifiers as string | null);
      if (!uses.every((use) => typeof use === 'string')) throw new Error('Invalid item uses.');
      if (!modifiers.every((modifier) => typeof modifier.name === 'string' && typeof modifier.value === 'string')) {
        throw new Error('Invalid item modifier.');
      }
      items.set(id, {
        id,
        name: row.name,
        image: String(row.image ?? ''),
        uses,
        modifiers,
        stomach: Number(row.stomach ?? 0),
        liver: Number(row.liver ?? 0),
        spleen: Number(row.spleen ?? 0),
        quality: typeof row.quality === 'string' ? row.quality : null,
        adventures: row.adventures == null ? null : Number(row.adventures),
        notes: String(row.notes ?? ''),
      });
    }

    const effects = database
      .prepare(
        `SELECT e.id, e.name, e.quality, e.nohookah, e.notcrs, e.ambiguous, em.modifiers
         FROM effects AS e
         LEFT JOIN effectModifiers AS em ON em.effect = e.id
         ORDER BY e.id`,
      )
      .all()
      .map((value) => {
        const row = value as Record<string, unknown>;
        return {
          id: Number(row.id),
          name: String(row.name),
          quality: String(row.quality),
          noHookah: Boolean(row.nohookah),
          notTcrs: Boolean(row.notcrs),
          ambiguous: Boolean(row.ambiguous),
          modifiers: parseJsonArray<SourceModifier>(row.modifiers as string | null),
        } satisfies SourceEffect;
      });
    if (items.size < 1_000 || effects.length < 100) throw new Error('Data of Loathing is incomplete.');

    return { items, effects, lastUpdate: meta.last_update, lastRevision: meta.last_revision };
  } finally {
    database.close();
  }
}
