import type { ComponentType } from 'react';
import {
  Backpack,
  Crown,
  FlaskConical,
  Gem,
  PawPrint,
  Scissors,
  Shield,
  Shirt,
  Sparkles,
  Sword,
  Utensils,
  Wine,
} from 'lucide-react';
import type { ItemTypeKey } from '../types';

export interface TypeConfig {
  key: ItemTypeKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const CONSUMABLE_TYPE_CONFIGS: TypeConfig[] = [
  { key: 'food', label: 'Food', icon: Utensils },
  { key: 'booze', label: 'Booze', icon: Wine },
  { key: 'spleen', label: 'Spleen', icon: Sparkles },
  { key: 'potion', label: 'Regular Potion', icon: FlaskConical },
  { key: 'monsterManualPotion', label: 'Avatar Potion', icon: FlaskConical },
];

export const EQUIPMENT_TYPE_CONFIGS: TypeConfig[] = [
  { key: 'hat', label: 'Hat', icon: Crown },
  { key: 'container', label: 'Back', icon: Backpack },
  { key: 'shirt', label: 'Shirt', icon: Shirt },
  { key: 'weapon', label: 'Weapon', icon: Sword },
  { key: 'offhand', label: 'Off-hand', icon: Shield },
  { key: 'pants', label: 'Pants', icon: Scissors },
  { key: 'accessory', label: 'Accessory', icon: Gem },
  { key: 'familiar', label: 'Familiar Equipment', icon: PawPrint },
];

export const ALL_TYPE_CONFIGS: TypeConfig[] = [...CONSUMABLE_TYPE_CONFIGS, ...EQUIPMENT_TYPE_CONFIGS];
