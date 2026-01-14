/**
 * X/Twitter Ingestion System Tests
 *
 * Tests for the X/Twitter profile ingestion system including:
 * - XProfileAdapter: Profile fetching with mock and error handling
 * - PersonalityExtractor: Trait extraction and archetype detection
 * - IngestionPipeline: Full pipeline orchestration
 *
 * The Hitchhiker's Guide notes: "Testing ingestion systems is like
 * testing a teleporter - you need to verify the person who comes out
 * is roughly similar to the one who went in, personality-wise."
 */

import { test, expect } from '@playwright/test';

// Adapters
import {
  MockXProfileAdapter,
  ApifyXProfileAdapter,
  getDefaultXProfileAdapter,
  type XProfile,
} from '@/lib/ingestion/XProfileAdapter';

// Personality extraction
import {
  extractPersonalityFromProfile,
  extractPersonalityRuleBased,
  buildExtractionPrompt,
  parseLLMResponse,
  quickExtract,
} from '@/lib/ingestion/PersonalityExtractor';

// Pipeline
import {
  previewIngestion,
  ingestXProfile,
  batchIngestXProfiles,
  resetRateLimiter,
  type IngestionProgress,
} from '@/lib/ingestion/IngestionPipeline';

// =============================================================================
// MOCK DATA
// =============================================================================

const mockBuilderProfile: XProfile = {
  id: 'mock-builder-123',
  username: 'eth_builder_test',
  displayName: 'ETH Builder',
  bio: 'Building the future of DeFi | Solidity dev | Ship ship ship 🚀',
  profileImageUrl: 'https://example.com/avatar.jpg',
  recentTweets: [
    {
      id: 'tweet-1',
      text: 'Just deployed a new smart contract for yield optimization. Thread incoming 🧵',
      createdAt: '2024-01-15T10:00:00Z',
      likeCount: 500,
      retweetCount: 100,
      replyCount: 50,
    },
    {
      id: 'tweet-2',
      text: 'Building in DeFi is like building a plane while flying it. Fun times.',
      createdAt: '2024-01-14T18:00:00Z',
      likeCount: 1000,
      retweetCount: 200,
      replyCount: 80,
    },
    {
      id: 'tweet-3',
      text: 'Security audit passed! Your funds are safu. 🔒',
      createdAt: '2024-01-13T12:00:00Z',
      likeCount: 2000,
      retweetCount: 400,
      replyCount: 150,
    },
  ],
  followerCount: 50000,
  followingCount: 1200,
  isVerified: true,
  location: 'Ethereum',
};

const mockDegenProfile: XProfile = {
  id: 'mock-degen-456',
  username: 'degen_ape_test',
  displayName: 'Degen Ape 🦍',
  bio: 'Full-time degen | Aping into everything | WAGMI | NFA',
  profileImageUrl: 'https://example.com/degen.jpg',
  recentTweets: [
    {
      id: 'tweet-1',
      text: 'Just aped into this new thing. 100x or rug, no in between 🦍',
      createdAt: '2024-01-15T10:00:00Z',
      likeCount: 100,
      retweetCount: 20,
      replyCount: 30,
    },
    {
      id: 'tweet-2',
      text: 'WAGMI frens. We are so early!',
      createdAt: '2024-01-14T18:00:00Z',
      likeCount: 200,
      retweetCount: 50,
      replyCount: 40,
    },
    {
      id: 'tweet-3',
      text: 'Leverage is just a number. NGMI if you cant handle volatility.',
      createdAt: '2024-01-13T12:00:00Z',
      likeCount: 150,
      retweetCount: 30,
      replyCount: 60,
    },
  ],
  followerCount: 5000,
  followingCount: 2000,
  isVerified: false,
  location: 'Decentralized',
};

// =============================================================================
// XPROFILE ADAPTER TESTS
// =============================================================================

test.describe('XProfileAdapter', () => {
  test.describe('MockXProfileAdapter', () => {
    test('should have correct metadata', () => {
      expect(MockXProfileAdapter.id).toBe('mock');
      expect(MockXProfileAdapter.displayName).toContain('Mock');
      expect(MockXProfileAdapter.isAvailable()).toBe(true);
    });

    test('should fetch a profile successfully', async () => {
      const result = await MockXProfileAdapter.fetchProfile('testuser');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.profile.username).toBe('testuser');
        expect(result.profile.id).toContain('mock-');
        expect(result.profile.recentTweets.length).toBeGreaterThan(0);
      }
    });

    test('should generate deterministic profiles based on username', async () => {
      const result1 = await MockXProfileAdapter.fetchProfile('consistent_user');
      const result2 = await MockXProfileAdapter.fetchProfile('consistent_user');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (result1.success && result2.success) {
        // Bio and personality should be consistent (same hash)
        expect(result1.profile.followerCount).toBe(result2.profile.followerCount);
      }
    });

    test('should return NOT_FOUND for special usernames', async () => {
      const result = await MockXProfileAdapter.fetchProfile('notfound');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('NOT_FOUND');
      }
    });

    test('should return SUSPENDED for suspended usernames', async () => {
      const result = await MockXProfileAdapter.fetchProfile('suspended');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('SUSPENDED');
      }
    });

    test('should return PRIVATE for private accounts', async () => {
      const result = await MockXProfileAdapter.fetchProfile('private');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('PRIVATE');
      }
    });

    test('should return INVALID_USERNAME for bad formats', async () => {
      const result = await MockXProfileAdapter.fetchProfile('invalid username!');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_USERNAME');
      }
    });

    test('should respect maxTweets option', async () => {
      const result = await MockXProfileAdapter.fetchProfile('testuser', { maxTweets: 2 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.profile.recentTweets.length).toBeLessThanOrEqual(2);
      }
    });
  });

  test.describe('ApifyXProfileAdapter', () => {
    test('should report unavailable without API token', () => {
      expect(ApifyXProfileAdapter.isAvailable()).toBe(false);
    });

    test('should return error when called without configuration', async () => {
      const result = await ApifyXProfileAdapter.fetchProfile('someuser');

      expect(result.success).toBe(false);
    });
  });

  test.describe('getDefaultXProfileAdapter', () => {
    test('should return mock adapter when Apify is not configured', () => {
      const adapter = getDefaultXProfileAdapter();
      expect(adapter.id).toBe('mock');
    });
  });
});

// =============================================================================
// PERSONALITY EXTRACTOR TESTS
// =============================================================================

test.describe('PersonalityExtractor', () => {
  test.describe('extractPersonalityRuleBased', () => {
    test('should detect eth_builder archetype', () => {
      const traits = extractPersonalityRuleBased(mockBuilderProfile);

      expect(traits.archetype).toBe('eth_builder');
      expect(traits.occupation).toBe('developer');
      expect(traits.confidence).toBeGreaterThan(0.5);
    });

    test('should detect degen_trader archetype', () => {
      const traits = extractPersonalityRuleBased(mockDegenProfile);

      expect(traits.archetype).toBe('degen_trader');
      expect(traits.confidence).toBeGreaterThan(0.5);
    });

    test('should generate 5 dialogue seeds', () => {
      const traits = extractPersonalityRuleBased(mockBuilderProfile);

      expect(traits.dialogueSeeds).toHaveLength(5);
      traits.dialogueSeeds.forEach((seed) => {
        expect(typeof seed).toBe('string');
        expect(seed.length).toBeLessThanOrEqual(50);
      });
    });

    test('should generate valid personality traits', () => {
      const traits = extractPersonalityRuleBased(mockBuilderProfile);

      // Big Five traits should be 0-1
      expect(traits.personality.bigFive.openness).toBeGreaterThanOrEqual(0);
      expect(traits.personality.bigFive.openness).toBeLessThanOrEqual(1);
      expect(traits.personality.bigFive.conscientiousness).toBeGreaterThanOrEqual(0);
      expect(traits.personality.bigFive.conscientiousness).toBeLessThanOrEqual(1);

      // Crypto traits should be 0-1
      expect(traits.personality.crypto.riskTolerance).toBeGreaterThanOrEqual(0);
      expect(traits.personality.crypto.riskTolerance).toBeLessThanOrEqual(1);
      expect(traits.personality.crypto.technicalKnowledge).toBeGreaterThanOrEqual(0);
      expect(traits.personality.crypto.technicalKnowledge).toBeLessThanOrEqual(1);
    });

    test('should provide reasoning in result', () => {
      const traits = extractPersonalityRuleBased(mockBuilderProfile);

      expect(traits.reasoning).toBeDefined();
      expect(traits.reasoning).toContain('keyword');
    });
  });

  test.describe('extractPersonalityFromProfile', () => {
    test('should use rule-based extraction when LLM not requested', async () => {
      const traits = await extractPersonalityFromProfile(mockBuilderProfile, {
        useLLM: false,
      });

      expect(traits.archetype).toBe('eth_builder');
    });

    test('should fall back to rule-based when LLM requested but unavailable', async () => {
      const traits = await extractPersonalityFromProfile(mockBuilderProfile, {
        useLLM: true,
      });

      // Should still work via fallback
      expect(traits.archetype).toBeDefined();
      expect(traits.occupation).toBeDefined();
    });
  });

  test.describe('buildExtractionPrompt', () => {
    test('should include profile data in prompt', () => {
      const prompt = buildExtractionPrompt(mockBuilderProfile);

      expect(prompt).toContain('@eth_builder_test');
      expect(prompt).toContain('ETH Builder');
      expect(prompt).toContain('Building the future of DeFi');
      expect(prompt).toContain('50,000'); // Follower count formatted
    });

    test('should include tweets in prompt', () => {
      const prompt = buildExtractionPrompt(mockBuilderProfile);

      expect(prompt).toContain('smart contract');
      expect(prompt).toContain('yield optimization');
    });

    test('should include archetype options', () => {
      const prompt = buildExtractionPrompt(mockBuilderProfile);

      expect(prompt).toContain('bitcoin_maxi');
      expect(prompt).toContain('eth_builder');
      expect(prompt).toContain('degen_trader');
    });

    test('should request JSON response format', () => {
      const prompt = buildExtractionPrompt(mockBuilderProfile);

      expect(prompt).toContain('JSON');
      expect(prompt).toContain('"archetype"');
      expect(prompt).toContain('"occupation"');
    });
  });

  test.describe('parseLLMResponse', () => {
    test('should parse valid JSON response', () => {
      const response = `\`\`\`json
{
  "archetype": "eth_builder",
  "occupation": "developer",
  "dialogueSeeds": ["gm builders", "shipping code", "audit passed", "we build", "LFG"],
  "personality": {
    "bigFive": {
      "openness": 0.8,
      "conscientiousness": 0.7,
      "extraversion": 0.5,
      "agreeableness": 0.6,
      "neuroticism": 0.3
    },
    "crypto": {
      "riskTolerance": 0.5,
      "fomo": 0.3,
      "trustInInstitutions": 0.4,
      "technicalKnowledge": 0.9,
      "degenLevel": 0.4
    }
  },
  "confidence": 0.85,
  "reasoning": "Profile shows strong builder traits"
}
\`\`\``;

      const result = parseLLMResponse(response);

      expect(result).not.toBeNull();
      expect(result?.archetype).toBe('eth_builder');
      expect(result?.occupation).toBe('developer');
      expect(result?.dialogueSeeds).toHaveLength(5);
      expect(result?.confidence).toBe(0.85);
    });

    test('should handle raw JSON without code blocks', () => {
      const response = `{
  "archetype": "degen_trader",
  "occupation": "trader",
  "dialogueSeeds": ["wagmi", "ape in", "ngmi", "LFG", "gm"],
  "personality": {
    "bigFive": {
      "openness": 0.7,
      "conscientiousness": 0.2,
      "extraversion": 0.7,
      "agreeableness": 0.4,
      "neuroticism": 0.6
    },
    "crypto": {
      "riskTolerance": 0.9,
      "fomo": 0.9,
      "trustInInstitutions": 0.3,
      "technicalKnowledge": 0.5,
      "degenLevel": 0.95
    }
  },
  "confidence": 0.8
}`;

      const result = parseLLMResponse(response);

      expect(result).not.toBeNull();
      expect(result?.archetype).toBe('degen_trader');
    });

    test('should return null for invalid JSON', () => {
      const result = parseLLMResponse('This is not JSON at all');
      expect(result).toBeNull();
    });

    test('should return null for missing required fields', () => {
      const result = parseLLMResponse('{"archetype": "degen_trader"}');
      expect(result).toBeNull();
    });

    test('should clamp trait values to 0-1', () => {
      const response = `{
  "archetype": "degen_trader",
  "occupation": "trader",
  "dialogueSeeds": ["a", "b", "c", "d", "e"],
  "personality": {
    "bigFive": {
      "openness": 1.5,
      "conscientiousness": -0.5,
      "extraversion": 0.5,
      "agreeableness": 0.5,
      "neuroticism": 0.5
    },
    "crypto": {
      "riskTolerance": 2.0,
      "fomo": 0.5,
      "trustInInstitutions": 0.5,
      "technicalKnowledge": 0.5,
      "degenLevel": 0.5
    }
  },
  "confidence": 0.8
}`;

      const result = parseLLMResponse(response);

      expect(result).not.toBeNull();
      expect(result?.personality.bigFive.openness).toBe(1);
      expect(result?.personality.bigFive.conscientiousness).toBe(0);
      expect(result?.personality.crypto.riskTolerance).toBe(1);
    });
  });

  test.describe('quickExtract', () => {
    test('should extract archetype and occupation from bio and tweets', () => {
      const result = quickExtract('Building DeFi protocols', [
        'Just shipped a new smart contract',
        'Security audit passed',
      ]);

      expect(result.archetype).toBe('eth_builder');
      expect(result.occupation).toBe('developer');
    });

    test('should detect bitcoin_maxi from relevant keywords', () => {
      const result = quickExtract('Bitcoin maximalist | HODL forever', [
        'Altcoins are distractions',
        'Orange pill your friends',
      ]);

      expect(result.archetype).toBe('bitcoin_maxi');
    });
  });
});

// =============================================================================
// INGESTION PIPELINE TESTS
// =============================================================================

test.describe('IngestionPipeline', () => {
  test.describe('previewIngestion', () => {
    test('should return preview for valid username', async () => {
      const result = await previewIngestion('test_builder', {
        adapter: MockXProfileAdapter,
      });

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.username).toBe('test_builder');
        expect(result.archetype).toBeDefined();
        expect(result.occupation).toBeDefined();
        expect(result.dialogueSeeds).toHaveLength(5);
      }
    });

    test('should strip @ from username', async () => {
      const result = await previewIngestion('@test_builder', {
        adapter: MockXProfileAdapter,
      });

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.username).toBe('test_builder');
      }
    });

    test('should return error for not found profiles', async () => {
      const result = await previewIngestion('notfound', {
        adapter: MockXProfileAdapter,
      });

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.code).toBe('NOT_FOUND');
      }
    });
  });

  test.describe('ingestXProfile', () => {
    test('should successfully ingest a profile', async () => {
      const progressUpdates: IngestionProgress[] = [];

      const result = await ingestXProfile('test_user', {
        adapter: MockXProfileAdapter,
        gridSize: 50,
        onProgress: (p) => progressUpdates.push(p),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.npc).toBeDefined();
        expect(result.npc.name).toBeDefined();
        expect(result.npc.isIngestedUser).toBe(true);
        expect(result.npc.xUsername).toBe('test_user');
        expect(result.npc.hasX402Wallet).toBe(true);
        expect(result.npc.x402WalletAddress).toBeDefined();
        expect(result.profile).toBeDefined();
        expect(result.traits).toBeDefined();
        expect(result.duration).toBeGreaterThan(0);
      }

      // Check progress was reported
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates.some((p) => p.stage === 'fetching')).toBe(true);
      expect(progressUpdates.some((p) => p.stage === 'extracting')).toBe(true);
      expect(progressUpdates.some((p) => p.stage === 'spawning')).toBe(true);
      expect(progressUpdates.some((p) => p.stage === 'completed')).toBe(true);
    });

    test('should report failure for not found profiles', async () => {
      const result = await ingestXProfile('notfound', {
        adapter: MockXProfileAdapter,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('NOT_FOUND');
        expect(result.stage).toBe('fetching');
      }
    });

    test('should set personality archetype on NPC', async () => {
      const result = await ingestXProfile('builder_test', {
        adapter: MockXProfileAdapter,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.npc.personalityArchetype).toBeDefined();
        expect(result.traits.archetype).toBe(result.npc.personalityArchetype);
      }
    });

    test('should use spawn position if provided', async () => {
      const result = await ingestXProfile('positioned_user', {
        adapter: MockXProfileAdapter,
        gridSize: 50,
        spawnPosition: { x: 10, y: 15 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.npc.gridX).toBe(10);
        expect(result.npc.gridY).toBe(15);
      }
    });

    test('should skip wallet creation if disabled', async () => {
      const result = await ingestXProfile('no_wallet_user', {
        adapter: MockXProfileAdapter,
        createX402Wallet: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.npc.hasX402Wallet).toBeUndefined();
        expect(result.npc.x402WalletAddress).toBeUndefined();
      }
    });
  });

  test.describe('batchIngestXProfiles', () => {
    test('should ingest multiple profiles', async () => {
      const usernames = ['user1', 'user2', 'user3'];
      const completedUpdates: string[] = [];

      const result = await batchIngestXProfiles(usernames, {
        adapter: MockXProfileAdapter,
        delayBetween: 100, // Speed up test
        onEachComplete: (username) => completedUpdates.push(username),
      });

      expect(result.successful.length).toBe(3);
      expect(result.failed.length).toBe(0);
      expect(completedUpdates).toEqual(['user1', 'user2', 'user3']);
    });

    test('should handle mixed success/failure', async () => {
      const usernames = ['user1', 'notfound', 'user2'];

      const result = await batchIngestXProfiles(usernames, {
        adapter: MockXProfileAdapter,
        delayBetween: 100,
      });

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(1);
      expect(result.failed[0].username).toBe('notfound');
    });

    test('should track total duration', async () => {
      const usernames = ['user1', 'user2'];

      const result = await batchIngestXProfiles(usernames, {
        adapter: MockXProfileAdapter,
        delayBetween: 100,
      });

      expect(result.totalDuration).toBeGreaterThan(0);
    });
  });

  test.describe('Rate Limiting', () => {
    // Note: These tests interact with the global rate limiter
    // In a real test suite, you'd mock or reset the rate limiter between tests

    test('should complete ingestion before rate limit', async () => {
      // First few requests should succeed
      const result = await ingestXProfile('rate_test_user', {
        adapter: MockXProfileAdapter,
      });

      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

test.describe('Ingestion Integration', () => {
  test.beforeEach(() => {
    // Reset rate limiter before each integration test
    resetRateLimiter();
  });

  test('should create a fully-formed NPC from ingestion', async () => {
    const result = await ingestXProfile('integ_test', {
      adapter: MockXProfileAdapter,
      gridSize: 100,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const npc = result.npc;

      // Core identity
      expect(npc.id).toBeDefined();
      expect(npc.name).toBeDefined();
      expect(npc.walletAddress).toBeDefined();

      // Ingestion metadata
      expect(npc.isIngestedUser).toBe(true);
      expect(npc.xUsername).toBe('integ_test');
      expect(npc.ingestedProfile).toBeDefined();
      expect(npc.ingestedProfile?.profileId).toBeDefined();
      expect(npc.ingestedProfile?.dialogueSeeds?.length).toBeGreaterThan(0);

      // Personality
      expect(npc.personality).toBeDefined();
      expect(npc.personality.bigFive).toBeDefined();
      expect(npc.personality.crypto).toBeDefined();
      expect(npc.personalityArchetype).toBeDefined();

      // Position
      expect(npc.gridX).toBeGreaterThanOrEqual(0);
      expect(npc.gridX).toBeLessThan(100);
      expect(npc.gridY).toBeGreaterThanOrEqual(0);
      expect(npc.gridY).toBeLessThan(100);
    }
  });

  test('should handle the complete preview-to-ingest flow', async () => {
    // First preview
    const preview = await previewIngestion('flow_test', {
      adapter: MockXProfileAdapter,
    });

    expect('error' in preview).toBe(false);
    if (!('error' in preview)) {
      expect(preview.archetype).toBeDefined();

      // Then ingest
      const result = await ingestXProfile('flow_test', {
        adapter: MockXProfileAdapter,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // NPC should match preview
        expect(result.npc.xUsername).toBe(preview.username);
        expect(result.npc.personalityArchetype).toBe(preview.archetype);
      }
    }
  });
});
