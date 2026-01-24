import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialHash, createTileSpatialHash, getVisibleTiles } from './spatialHash';

describe('SpatialHash', () => {
  let hash: SpatialHash<{ id: number; x: number; y: number }>;

  beforeEach(() => {
    hash = new SpatialHash(8);
  });

  describe('insert and query', () => {
    it('should insert and retrieve items', () => {
      const item = { id: 1, x: 10, y: 10 };
      hash.insert(item, { minX: 10, maxX: 10, minY: 10, maxY: 10 });

      const results = hash.query({ minX: 0, maxX: 20, minY: 0, maxY: 20 });
      expect(results).toContainEqual(item);
    });

    it('should not retrieve items outside query bounds', () => {
      const item = { id: 1, x: 50, y: 50 };
      hash.insert(item, { minX: 50, maxX: 50, minY: 50, maxY: 50 });

      const results = hash.query({ minX: 0, maxX: 20, minY: 0, maxY: 20 });
      expect(results).not.toContainEqual(item);
    });

    it('should handle multiple items', () => {
      const item1 = { id: 1, x: 10, y: 10 };
      const item2 = { id: 2, x: 15, y: 15 };
      const item3 = { id: 3, x: 100, y: 100 };

      hash.insert(item1, { minX: 10, maxX: 10, minY: 10, maxY: 10 });
      hash.insert(item2, { minX: 15, maxX: 15, minY: 15, maxY: 15 });
      hash.insert(item3, { minX: 100, maxX: 100, minY: 100, maxY: 100 });

      const results = hash.query({ minX: 0, maxX: 20, minY: 0, maxY: 20 });
      expect(results).toHaveLength(2);
      expect(results).toContainEqual(item1);
      expect(results).toContainEqual(item2);
      expect(results).not.toContainEqual(item3);
    });
  });

  describe('remove', () => {
    it('should remove items', () => {
      const item = { id: 1, x: 10, y: 10 };
      hash.insert(item, { minX: 10, maxX: 10, minY: 10, maxY: 10 });
      hash.remove(item);

      const results = hash.query({ minX: 0, maxX: 20, minY: 0, maxY: 20 });
      expect(results).not.toContainEqual(item);
    });
  });

  describe('clear', () => {
    it('should clear all items', () => {
      hash.insert({ id: 1, x: 10, y: 10 }, { minX: 10, maxX: 10, minY: 10, maxY: 10 });
      hash.insert({ id: 2, x: 20, y: 20 }, { minX: 20, maxX: 20, minY: 20, maxY: 20 });
      hash.clear();

      const results = hash.query({ minX: 0, maxX: 100, minY: 0, maxY: 100 });
      expect(results).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      hash.insert({ id: 1, x: 10, y: 10 }, { minX: 10, maxX: 10, minY: 10, maxY: 10 });
      hash.insert({ id: 2, x: 20, y: 20 }, { minX: 20, maxX: 20, minY: 20, maxY: 20 });

      const stats = hash.getStats();
      expect(stats.itemCount).toBeGreaterThan(0);
      expect(stats.cellCount).toBeGreaterThan(0);
    });
  });
});

describe('createTileSpatialHash', () => {
  it('should create a spatial hash for a grid', () => {
    const hash = createTileSpatialHash(64);
    const tiles = getVisibleTiles(hash, { minX: 0, maxX: 10, minY: 0, maxY: 10 });
    
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.length).toBeLessThanOrEqual(121); // 11x11 grid
  });

  it('should only return tiles within bounds', () => {
    const hash = createTileSpatialHash(64);
    const tiles = getVisibleTiles(hash, { minX: 0, maxX: 5, minY: 0, maxY: 5 });
    
    tiles.forEach(tile => {
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.x).toBeLessThanOrEqual(5);
      expect(tile.y).toBeGreaterThanOrEqual(0);
      expect(tile.y).toBeLessThanOrEqual(5);
    });
  });
});
