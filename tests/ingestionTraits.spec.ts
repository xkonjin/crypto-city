import { test, expect } from '@playwright/test';
import { mapTraitsFromSocial } from '@/lib/ingestion/traitMapping';
import type { SocialProfileMetadata } from '@/lib/ingestion/socialAdapters';

test.describe('Ingestion Trait Mapping', () => {
  test('maps social metadata into valid trait ranges', async () => {
    const metadata: SocialProfileMetadata = {
      id: 'user-1',
      handle: 'cobie',
      displayName: 'Cobie',
      bio: 'Builder and market watcher.',
      topics: ['defi', 'nfts', 'l2', 'infra'],
      emojis: ['🚀', '🧱'],
      activeHours: [9, 12, 18],
      engagementRate: 0.06,
      followerCount: 12000,
      followingCount: 500,
      tone: 'builder',
    };

    const traits = mapTraitsFromSocial(metadata);
    const values = [
      traits.bigFive.openness,
      traits.bigFive.conscientiousness,
      traits.bigFive.extraversion,
      traits.bigFive.agreeableness,
      traits.bigFive.neuroticism,
      traits.crypto.riskTolerance,
      traits.crypto.fomo,
      traits.crypto.trustInInstitutions,
      traits.crypto.technicalKnowledge,
      traits.crypto.degenLevel,
    ];

    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  test('mapping is deterministic for same input', async () => {
    const metadata: SocialProfileMetadata = {
      id: 'user-2',
      handle: 'builder',
      displayName: 'Builder',
      topics: ['solidity'],
      emojis: [],
      activeHours: [10, 14],
      engagementRate: 0.02,
      followerCount: 800,
      followingCount: 200,
      tone: 'analytical',
    };

    const first = mapTraitsFromSocial(metadata);
    const second = mapTraitsFromSocial(metadata);

    expect(first).toEqual(second);
  });
});
