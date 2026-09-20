/** Extract the reviewed enum names that KoLmafia counts as re-rolled enchantments. */
export function readEnchantmentNames(javaSources: readonly string[]): ReadonlySet<string> {
  const names = new Set<string>();
  for (const source of javaSources) {
    const enumNames = new Map<string, string>();
    for (const match of source.matchAll(/^\s*([A-Z][A-Z0-9_]*)\(\s*"([^"]+)"/gm)) {
      enumNames.set(match[1], match[2]);
    }
    const declaration = source.match(/\bENCHANTMENTS\s*=\s*EnumSet\.of\(([\s\S]*?)\);/);
    if (!declaration) throw new Error('KoLmafia enchantment declarations changed.');
    for (const identifier of declaration[1].match(/\b[A-Z][A-Z0-9_]*\b/g) ?? []) {
      const name = enumNames.get(identifier);
      if (!name) throw new Error(`Unknown KoLmafia enchantment ${identifier}.`);
      names.add(name.toLowerCase());
    }
  }
  if (names.size < 50) throw new Error('KoLmafia enchantment inventory is incomplete.');
  return names;
}
