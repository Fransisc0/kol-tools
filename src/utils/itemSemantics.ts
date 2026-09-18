import { TCRSItem } from '../types';

type UnchangedCandidate = Pick<
  TCRSItem,
  | 'origName'
  | 'tcrsName'
  | 'itemModifiers'
  | 'effectName'
  | 'effectDuration'
  | 'effectModifiers'
  | 'size'
  | 'quality'
> &
  Partial<Pick<TCRSItem, 'extractedNumericBonus'>>;

const HTML_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  trade: '™',
  copy: '©',
  aacute: 'á',
  agrave: 'à',
  acirc: 'â',
  auml: 'ä',
  aelig: 'æ',
  ccedil: 'ç',
  eacute: 'é',
  egrave: 'è',
  ecirc: 'ê',
  euml: 'ë',
  iacute: 'í',
  icirc: 'î',
  ntilde: 'ñ',
  oacute: 'ó',
  oslash: 'ø',
  ouml: 'ö',
  uuml: 'ü',
  szlig: 'ß',
  iquest: '¿',
  plusmn: '±',
  frac12: '½',
  sup2: '²',
  para: '¶',
  micro: 'µ',
  permil: '‰',
  curren: '¤',
  dagger: '†',
  loz: '◊',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  atilde: 'Ã',
};

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z][\da-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const hexadecimal = entity[1]?.toLowerCase() === 'x';
      const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return HTML_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

const LOOKUP_ENTITIES: Readonly<Record<string, string>> = {
  '&trade': '™',
  '&trade;': '™',
  '&quot;': '"',
  '&amp;': '&',
  '&eacute;': 'é',
  '&#39;': "'",
};

/** Decodes the small legacy entity set used by KoLmafia lookup keys in exactly one pass. */
export function decodeLookupEntities(value: string): string {
  return value.replace(
    /&(?:trade;?|quot;|amp;|eacute;|#39;)/g,
    (entity) => LOOKUP_ENTITIES[entity] ?? entity,
  );
}

export function hasGenericFamiliarEffect(modifiers?: string): boolean {
  return /(?:^|,\s*)Familiar Effect\s*:/i.test(modifiers || '');
}

/** Removes metadata that describes an item but is not a functional modifier. */
export function getMeaningfulItemModifiers(modifiers?: string): string {
  if (!modifiers) return '';

  return modifiers
    .replace(/(?<!Familiar )Effect:\s*"[^"]*"/gi, '')
    .replace(/(?<!Familiar )Effect:\s*[^,]+/gi, '')
    .replace(/Effect Duration:\s*\d+/gi, '')
    .replace(/Familiar Effect:\s*"[^"]*"/gi, '')
    .replace(/Familiar Effect:\s*[^,]+/gi, '')
    .replace(/Last Available:\s*"[^"]*"/gi, '')
    .replace(/Last Available:\s*[^,]+/gi, '')
    .replace(/Wiki Name:\s*"[^"]*"/gi, '')
    .replace(/Wiki Name:\s*[^,]+/gi, '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * TCRS names are cosmetic. A generic Familiar Effect is also treated as cosmetic
 * when it is the item's only generated behavior.
 */
export function isFunctionallyUnchanged(item: UnchangedCandidate): boolean {
  const nameMatches = item.tcrsName.trim().toLowerCase() === item.origName.trim().toLowerCase();
  const meaningfulModifiers = getMeaningfulItemModifiers(item.itemModifiers);
  const hasEffect = Boolean(item.effectName?.trim() || item.effectDuration || item.effectModifiers?.trim());
  const hasConsumableResult = item.size > 0 || Boolean(item.quality?.trim());
  const hasExtractedBonus = Boolean(item.extractedNumericBonus);
  const hasNoFunctionalResult =
    !hasEffect && !hasConsumableResult && !hasExtractedBonus && !meaningfulModifiers;

  return hasNoFunctionalResult && (nameMatches || hasGenericFamiliarEffect(item.itemModifiers));
}
