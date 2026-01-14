import type { Tile } from '@/types/game';
import type { NPCPersonality } from '@/lib/npc/personality';
import { NPCManager } from '@/lib/npc/NPCManager';
import type { CryptoNPC } from '@/games/isocity/types/npc';
import { selectHousingForIngestedNPC } from '@/lib/npc/ingestedHousing';

export type IngestedProfile = {
  profileId: string;
  displayName: string;
  avatarSpritesheet?: string;
  /** Loaded HTMLImageElement for rendering custom sprites */
  avatarSpritesheetImage?: HTMLImageElement;
  traits: NPCPersonality;
  dialogueSeeds: string[];
};

export type IngestedSpawnOptions = {
  grid: Tile[][] | null;
  gridSize: number;
  spawnX?: number;
  spawnY?: number;
};

export function spawnIngestedNPC(profile: IngestedProfile, options: IngestedSpawnOptions): CryptoNPC {
  const spawnX = options.spawnX ?? Math.floor(Math.random() * options.gridSize);
  const spawnY = options.spawnY ?? Math.floor(Math.random() * options.gridSize);

  const residenceId = selectHousingForIngestedNPC(profile, options.grid, options.gridSize);

  const npc = NPCManager.spawnNPC({
    gridX: spawnX,
    gridY: spawnY,
    residenceId: residenceId || undefined,
  });

  npc.name = profile.displayName;
  npc.personality = profile.traits;
  npc.ingestedProfile = {
    profileId: profile.profileId,
    avatarSpritesheet: profile.avatarSpritesheet,
    avatarSpritesheetImage: profile.avatarSpritesheetImage,
    avatarAnimFrame: 0,
    dialogueSeeds: profile.dialogueSeeds,
  };

  // Set custom sprite type if avatar was generated
  if (profile.avatarSpritesheet || profile.avatarSpritesheetImage) {
    npc.spriteType = 'custom';
  }

  return npc;
}
