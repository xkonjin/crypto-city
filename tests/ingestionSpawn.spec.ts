import { test, expect } from '@playwright/test';
import type { Tile } from '@/types/game';
import { RESIDENTIAL_BUILDINGS } from '@/games/isocity/types/buildings';
import { NPCManager } from '@/lib/npc/NPCManager';
import { mapTraitsFromSocial } from '@/lib/ingestion/traitMapping';
import { buildDialogueSeeds } from '@/lib/ingestion/dialogueSeeds';
import { spawnIngestedNPC } from '@/lib/ingestion/spawnIngestedNPC';

test.describe('Ingested NPC spawning', () => {
  test('spawns NPC with ingested profile data', async () => {
    NPCManager.clear();

    const traits = mapTraitsFromSocial({
      id: 'user-3',
      handle: 'cobie',
      displayName: 'Cobie',
      topics: ['defi'],
      emojis: ['🚀'],
      activeHours: [9],
      engagementRate: 0.03,
      followerCount: 5000,
      followingCount: 200,
      tone: 'hype',
    });

    const seeds = buildDialogueSeeds({
      id: 'user-3',
      handle: 'cobie',
      displayName: 'Cobie',
      topics: ['defi'],
      emojis: ['🚀'],
      activeHours: [9],
      engagementRate: 0.03,
      followerCount: 5000,
      followingCount: 200,
      tone: 'hype',
    });

    const npc = spawnIngestedNPC(
      {
        profileId: 'user-3',
        displayName: 'Cobie',
        traits,
        dialogueSeeds: seeds,
        avatarSpritesheet: '/figurines/cobie/idle--default.png',
      },
      { grid: null, gridSize: 10 }
    );

    expect(npc.name).toBe('Cobie');
    expect(npc.ingestedProfile?.profileId).toBe('user-3');
    expect(npc.ingestedProfile?.dialogueSeeds.length).toBeGreaterThan(0);
    expect(npc.personality).toEqual(traits);
  });

  test('assigns residence when residential grid is provided', async () => {
    NPCManager.clear();

    const buildingType = RESIDENTIAL_BUILDINGS[0];
    const tile: Tile = {
      x: 0,
      y: 0,
      zone: 'residential',
      building: {
        type: buildingType,
        level: 1,
        population: 0,
        jobs: 0,
        powered: true,
        watered: true,
        onFire: false,
        fireProgress: 0,
        age: 0,
        constructionProgress: 1,
        abandoned: false,
      },
      landValue: 10,
      pollution: 0,
      crime: 0,
      traffic: 0,
      hasSubway: false,
    };

    const grid: Tile[][] = [[tile]];

    const traits = mapTraitsFromSocial({
      id: 'user-4',
      handle: 'builder',
      displayName: 'Builder',
      topics: ['infra'],
      emojis: [],
      activeHours: [10],
      engagementRate: 0.01,
      followerCount: 300,
      followingCount: 100,
      tone: 'builder',
    });

    const npc = spawnIngestedNPC(
      {
        profileId: 'user-4',
        displayName: 'Builder',
        traits,
        dialogueSeeds: ['topic:infra'],
      },
      { grid, gridSize: 1, spawnX: 0, spawnY: 0 }
    );

    expect(npc.residence).toBe('building-0-0');
  });
});
