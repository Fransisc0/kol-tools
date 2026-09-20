/** Compact, versioned build artifact; not an upstream source of truth. */
export type TCRSRecord = readonly [
  id: number,
  name: string,
  size: number,
  quality: string,
  modifiers: string,
];

export interface TCRSRecordSet {
  version: 1;
  className: string;
  moonSign: string;
  main: TCRSRecord[];
  cafeFood: TCRSRecord[];
  cafeBooze: TCRSRecord[];
}

function isRecord(value: unknown): value is TCRSRecord {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    Number.isSafeInteger(value[0]) &&
    typeof value[1] === 'string' &&
    Number.isSafeInteger(value[2]) &&
    typeof value[3] === 'string' &&
    typeof value[4] === 'string'
  );
}

export function assertTCRSRecordSet(
  value: unknown,
  className: string,
  moonSign: string,
): asserts value is TCRSRecordSet {
  if (!value || typeof value !== 'object') throw new Error('Invalid TCRS dataset.');
  const data = value as Partial<TCRSRecordSet>;
  if (
    data.version !== 1 ||
    data.className !== className ||
    data.moonSign !== moonSign ||
    !Array.isArray(data.main) ||
    !Array.isArray(data.cafeFood) ||
    !Array.isArray(data.cafeBooze) ||
    data.main.length < 1_000
  ) {
    throw new Error('Invalid TCRS dataset.');
  }
  for (const records of [data.main, data.cafeFood, data.cafeBooze]) {
    const ids = new Set<number>();
    for (const record of records) {
      if (!isRecord(record)) throw new Error('Invalid TCRS item record.');
      if (ids.has(record[0])) throw new Error('Duplicate TCRS item ID.');
      ids.add(record[0]);
    }
  }
}
