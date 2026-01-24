// Stub file for NPC inventory items
export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  price: number;
  icon?: string;
  quantity: number;
}

export function getItem(id: string): InventoryItem | null {
  return null;
}

export function getRarityColor(rarity: string): string {
  return '#ffffff';
}
