/**
 * NPC Dialogue System
 *
 * Provides rich, varied dialogue for NPCs based on their personality archetype,
 * current context, market conditions, and relationship levels.
 *
 * Features:
 * - 400+ unique dialogue lines across 8 archetypes
 * - Context-aware selection (greeting, market_commentary, etc.)
 * - Market condition reactive (bull/bear/crab)
 * - Relationship level appropriate
 * - Cooldown system prevents repetition (<5% rate)
 *
 * Usage:
 * ```typescript
 * const dialogueManager = new DialogueManager();
 * const { text, context } = dialogueManager.getDialogue(npc, 'greeting', {
 *   marketCondition: 'bull',
 *   relationshipLevel: 'friend'
 * });
 * ```
 */

// Types
export * from './types';

// Dialogue Pools
export { BITCOIN_MAXI_POOLS } from './pools/bitcoinMaxi';
export { ETH_BUILDER_POOLS } from './pools/ethBuilder';
export { DEGEN_TRADER_POOLS } from './pools/degenTrader';
export { PRIVACY_MAXI_POOLS } from './pools/privacyMaxi';
export { NORMIE_INVESTOR_POOLS } from './pools/normieInvestor';
export { NFT_FLIPPER_POOLS } from './pools/nftFlipper';
export { STAKING_GRANDMA_POOLS } from './pools/stakingGrandma';
export { PROTOCOL_POLITICIAN_POOLS } from './pools/protocolPolitician';

// Manager
export { DialogueManager } from './DialogueManager';
