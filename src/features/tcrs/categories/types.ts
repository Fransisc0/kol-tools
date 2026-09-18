import type { TCRSDataResponse, TCRSItem } from '../../../types';

export interface CategoryRuleContext {
  response: TCRSDataResponse;
  baseItem: Omit<TCRSItem, 'extractedNumericBonus'>;
  combined: string;
  quality: string;
  primaryUse: string;
  forcedType: string;
  size: number;
  isPotion: boolean;
  effectName?: string;
  effectDuration?: number;
}
