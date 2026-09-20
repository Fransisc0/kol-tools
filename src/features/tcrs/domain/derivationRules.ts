/** KoLmafia's exceptional item routing, resolved against its current item/effect IDs. */
export interface DerivationRules {
  readonly notRerolled: ReadonlySet<number>;
  readonly generic: ReadonlySet<number>;
  readonly unalteredConsumables: ReadonlySet<number>;
  readonly zeroSizeConsumables: ReadonlySet<number>;
  readonly zeroAdventureConsumables: ReadonlySet<number>;
  readonly hardcodedEffect: ReadonlySet<number>;
  readonly hardcodedDynamicDuration: ReadonlySet<number>;
  readonly hardcodedEffectOverride: ReadonlyMap<number, number>;
  readonly glitchItem: number;
}
