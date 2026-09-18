export function categorizeNPCStore(storeName: string): string {
  const sn = storeName.toLowerCase();
  if (
    [
      'doc galaktik',
      'general store',
      'meatsmith',
      'armory and leggery',
      'hermit',
      'gift shop',
      'huggler',
      'drip institute cafeteria',
      'drip institute armory',
      'bart ender',
      'suspicious-looking guy',
    ].some((s) => sn.includes(s))
  )
    return 'Early Game Stores';

  if (
    ['degrassi knoll bakery', 'chez snootée', 'little canadia jewelers', 'gno-mart', 'chez snootee'].some(
      (s) => sn.includes(s),
    )
  )
    return 'Moonsign Stores';

  if (['smacketeria', "gouda's", 'shadowy store'].some((s) => sn.includes(s))) return 'Guild Stores';

  if (
    [
      'knob dispensary',
      'hippy store',
      'black market',
      'hidden tavern',
      'organic produce stand',
      'bugbear bakery',
      'white citadel',
      'barrrtleby',
    ].some((s) => sn.includes(s))
  )
    return 'Quest Stores';

  return 'Other NPC Stores';
}
