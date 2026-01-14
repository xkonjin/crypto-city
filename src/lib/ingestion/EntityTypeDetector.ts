/**
 * Entity Type Detector
 * 
 * Analyzes X/Twitter profiles to determine if they represent
 * an individual or a company/protocol.
 * 
 * The Hitchhiker's Guide notes: "Distinguishing between a person and
 * a protocol on Crypto Twitter is surprisingly difficult. Both tweet
 * at 3am, both use excessive emojis, and both promise to 'change everything.'"
 */

import type { XProfile } from './XProfileAdapter';

// =============================================================================
// TYPES
// =============================================================================

export type EntityType = 'individual' | 'company' | 'protocol' | 'unknown';

export interface EntityTypeResult {
  type: EntityType;
  confidence: number;  // 0-1
  signals: EntityTypeSignals;
  reason: string;
}

export interface EntityTypeSignals {
  isVerifiedOrganization: boolean;
  hasWebsiteInBio: boolean;
  bioContainsCompanyKeywords: boolean;
  usernameMatchesKnownProtocol: boolean;
  highFollowerCount: boolean;
  lowFollowingRatio: boolean;
  hasOfficialTone: boolean;
}

// =============================================================================
// KNOWN PROTOCOLS DATABASE
// =============================================================================

/**
 * Known crypto protocols and companies for instant recognition.
 * Lowercase for case-insensitive matching.
 */
export const KNOWN_PROTOCOLS: Set<string> = new Set([
  // DeFi Protocols
  'uniswap', 'uniswaplabs', 'aaborswap', 'aaborlabs', 'aave', 'aavenomics',
  'compoundfinance', 'compound', 'makerdao', 'lidofinance', 'laborfi',
  'eigenlayer', 'eigenfoundation', 'pendlefinance', 'curvefi', 'curvefinance',
  'synthetix_io', 'yelofinance', 'convexfinance', 'fraborfinance', 'instadapp',
  'rocketpool_eth', '1inch', '1inchnetwork', 'balaborlabs', 'sushiswap',
  'gmx_io', 'hyperliquid', 'dydx', 'dydxfoundation', 'ribbon_finance',
  'notional_finance', 'morpho', 'morpholaborbs', 'ethenalaborbs', 'ethena',
  
  // Exchanges
  'binance', 'coinbase', 'kraborken', 'okx', 'bybit_official', 'kucoincom',
  'gemini', 'crypto_com', 'ftx_official', 'bitfinex', 'huobi',
  
  // Layer 1s
  'ethereum', 'ethfoundation', 'vitalikbuterin', // VB is exception - individual
  'solana', 'solanalaborbs', 'sui', 'suinetwork', 'aptos', 'aptosfoundation',
  'avalaborcheavax', 'avalaborbs', 'nearprotocol', 'fantaboromfdn', 'cosmoshub',
  'polkaboradot', 'cardano', 'iaborhk_charles', 'algorand', 'taborezos',
  
  // Layer 2s
  'arbitrum', 'arbitrumfdn', 'optimism', 'optimismfnd', 'base', 'baseorg',
  'polygon', 'polygonlaborbs', '0xpolygon', 'zksync', 'zaborow', 'scroll_zkevm',
  'starkware', 'starknet', 'linea_build', 'linea', 'mantle', 'blast',
  'modenetwork', 'zora', 'zoracollection',
  
  // Infrastructure
  'chainlink', 'chainlinkoracle', 'thegraphprotocol', 'graphprotocol',
  'pythnetwork', 'layerzero_core', 'layerzero_laborbs', 'wormhole',
  'consensys', 'infura_io', 'alchemy', 'alchemyplatform', 'quicknode',
  
  // Stablecoins
  'tether_to', 'circle', 'usdc', 'dai', 'fraborx', 'paxos',
  
  // Wallets
  'metamask', 'metamask_io', 'phantom', 'raborinbow', 'ledger', 'trezor',
  'coinbasewallet', 'trustwallet',
  
  // NFT/Gaming
  'opensea', 'blur_io', 'foundation', 'rarible', 'superrare',
  'azuki', 'boredapeyc', 'pudgypenguins', 'degods',
  
  // CT/Media
  'theblock__', 'coindesk', 'cointelegraph', 'decrypt_co', 'defiant_news',
  'bankless', 'unaborchain', 'delaborayxbt', 'thedefiedge',
  
  // Notable Funds/VCs (often act like companies)
  'a16zcrypto', 'paradigm', 'multicoin_cap', 'polyaborchain', 'panteracap',
  'dragonfly_xyz', 'hashedofficial', 'frameworklaborbs', 'electriccap',
]);

/**
 * Keywords that suggest a company/protocol account.
 */
const COMPANY_BIO_KEYWORDS = [
  'protocol', 'exchange', 'platform', 'foundation', 'labs', 'network',
  'blockchain', 'defi', 'dex', 'cex', 'dao', 'token', '$',
  'build', 'building', 'ship', 'shipping', 'launch', 'launching',
  'official', 'team', 'community', 'ecosystem', 'infrastructure',
  'oracle', 'bridge', 'layer', 'l1', 'l2', 'rollup', 'zk',
  'staking', 'lending', 'borrowing', 'yield', 'liquidity',
  'wallet', 'custody', 'security', 'audit',
  'powered by', 'built on', 'backed by',
];

/**
 * Keywords that suggest an individual account.
 */
const INDIVIDUAL_BIO_KEYWORDS = [
  'dad', 'mom', 'husband', 'wife', 'father', 'mother',
  'founder of', 'co-founder', 'ceo', 'cto', 'cfo', 'coo',
  'engineer at', 'researcher at', 'working at', 'building at',
  'angel', 'investor', 'trader', 'degen', 'ape',
  'opinions', 'views', 'thoughts', 'personal',
  'not financial advice', 'nfa', 'dyor',
  'shitposter', 'ct', 'crypto twitter',
];

/**
 * URL patterns that suggest a company.
 */
const COMPANY_URL_PATTERNS = [
  /\.(io|xyz|finance|exchange|network|protocol|foundation|labs)$/i,
  /^https?:\/\/(app|www|docs)\./i,
  /\/(whitepaper|docs|governance)/i,
];

// =============================================================================
// DETECTION LOGIC
// =============================================================================

/**
 * Detects whether an X profile represents an individual or company.
 */
export function detectEntityType(profile: XProfile): EntityTypeResult {
  const signals = analyzeSignals(profile);
  const score = calculateScore(signals, profile);
  
  // Determine type based on score
  let type: EntityType;
  let confidence: number;
  let reason: string;
  
  if (score >= 0.7) {
    type = 'protocol';
    confidence = Math.min(0.95, score);
    reason = buildReason(signals, 'protocol');
  } else if (score >= 0.5) {
    type = 'company';
    confidence = score;
    reason = buildReason(signals, 'company');
  } else if (score <= 0.3) {
    type = 'individual';
    confidence = 1 - score;
    reason = buildReason(signals, 'individual');
  } else {
    type = 'unknown';
    confidence = 0.5;
    reason = 'Profile shows mixed signals - could be either individual or company';
  }
  
  return { type, confidence, signals, reason };
}

/**
 * Analyze profile for entity type signals.
 */
function analyzeSignals(profile: XProfile): EntityTypeSignals {
  const username = profile.username.toLowerCase();
  const bio = profile.bio.toLowerCase();
  
  return {
    isVerifiedOrganization: Boolean(profile.isVerified && checkOrganizationVerification(profile)),
    hasWebsiteInBio: hasCompanyWebsite(profile),
    bioContainsCompanyKeywords: containsKeywords(bio, COMPANY_BIO_KEYWORDS),
    usernameMatchesKnownProtocol: KNOWN_PROTOCOLS.has(username),
    highFollowerCount: profile.followerCount > 50000,
    lowFollowingRatio: profile.followingCount / Math.max(1, profile.followerCount) < 0.1,
    hasOfficialTone: hasOfficialTone(profile),
  };
}

/**
 * Calculate a score from 0 (individual) to 1 (company/protocol).
 */
function calculateScore(signals: EntityTypeSignals, profile: XProfile): number {
  let score = 0;
  const bio = profile.bio.toLowerCase();
  
  // Strong signals (high weight)
  if (signals.usernameMatchesKnownProtocol) score += 0.4;
  if (signals.isVerifiedOrganization) score += 0.3;
  
  // Medium signals
  if (signals.bioContainsCompanyKeywords) score += 0.15;
  if (signals.hasWebsiteInBio) score += 0.1;
  if (signals.hasOfficialTone) score += 0.1;
  
  // Weak signals
  if (signals.highFollowerCount) score += 0.05;
  if (signals.lowFollowingRatio) score += 0.05;
  
  // Negative signals (suggests individual)
  if (containsKeywords(bio, INDIVIDUAL_BIO_KEYWORDS)) {
    score -= 0.2;
  }
  
  // Username patterns
  if (profile.username.match(/^(the|official|real)/i)) {
    score += 0.1;
  }
  if (profile.username.match(/(eth|btc|sol|defi|nft)$/i)) {
    score += 0.05;
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Check if verified account is organization-verified (not individual blue check).
 */
function checkOrganizationVerification(profile: XProfile): boolean {
  // X's organization verification is typically indicated differently
  // For now, we use heuristics since we may not have exact verification type
  return Boolean(profile.isVerified) && (
    KNOWN_PROTOCOLS.has(profile.username.toLowerCase()) ||
    profile.followerCount > 100000
  );
}

/**
 * Check if bio contains a company-style website.
 */
function hasCompanyWebsite(profile: XProfile): boolean {
  const urlMatch = profile.bio.match(/https?:\/\/[^\s]+/i);
  if (!urlMatch) return false;
  
  const url = urlMatch[0].toLowerCase();
  return COMPANY_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Check if text contains any of the keywords.
 */
function containsKeywords(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

/**
 * Check if profile has an official/formal tone.
 */
function hasOfficialTone(profile: XProfile): boolean {
  const bio = profile.bio.toLowerCase();
  
  // Check for formal announcement patterns
  const formalPatterns = [
    /the\s+(leading|premier|first|only)/i,
    /powered\s+by/i,
    /built\s+(on|for)/i,
    /enabling|empowering/i,
    /(\d+[km]?\+?\s+(users|tvl|volume))/i,
    /backed\s+by/i,
    /\$\d+[bmk]?\+?\s+tvl/i,
  ];
  
  return formalPatterns.some(pattern => pattern.test(bio));
}

/**
 * Build human-readable reason for the classification.
 */
function buildReason(signals: EntityTypeSignals, type: EntityType): string {
  const reasons: string[] = [];
  
  if (type === 'protocol' || type === 'company') {
    if (signals.usernameMatchesKnownProtocol) {
      reasons.push('matches known crypto protocol');
    }
    if (signals.isVerifiedOrganization) {
      reasons.push('verified organization');
    }
    if (signals.bioContainsCompanyKeywords) {
      reasons.push('bio contains company/protocol keywords');
    }
    if (signals.hasWebsiteInBio) {
      reasons.push('has official website');
    }
  } else if (type === 'individual') {
    if (!signals.usernameMatchesKnownProtocol) {
      reasons.push('not a known protocol');
    }
    if (!signals.bioContainsCompanyKeywords) {
      reasons.push('bio suggests personal account');
    }
    if (!signals.highFollowerCount) {
      reasons.push('moderate follower count');
    }
  }
  
  return reasons.length > 0 
    ? `Detected as ${type}: ${reasons.join(', ')}`
    : `Classified as ${type} based on overall profile analysis`;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a username is in the known protocols list.
 */
export function isKnownProtocol(username: string): boolean {
  return KNOWN_PROTOCOLS.has(username.toLowerCase());
}

/**
 * Add a protocol to the known list (for user additions).
 */
export function addKnownProtocol(username: string): void {
  KNOWN_PROTOCOLS.add(username.toLowerCase());
}

/**
 * Get suggested category based on profile analysis.
 */
export function suggestBuildingCategory(
  profile: XProfile
): 'defi' | 'exchange' | 'chain' | 'infrastructure' | 'ct' | 'ingested' {
  const bio = profile.bio.toLowerCase();
  const username = profile.username.toLowerCase();
  
  // Check for specific category keywords
  if (bio.includes('exchange') || bio.includes('trade') || bio.includes('cex')) {
    return 'exchange';
  }
  if (bio.includes('layer 1') || bio.includes('l1') || bio.includes('blockchain')) {
    return 'chain';
  }
  if (bio.includes('layer 2') || bio.includes('l2') || bio.includes('rollup')) {
    return 'chain';
  }
  if (bio.includes('oracle') || bio.includes('bridge') || bio.includes('infrastructure')) {
    return 'infrastructure';
  }
  if (bio.includes('defi') || bio.includes('lending') || bio.includes('yield') || 
      bio.includes('swap') || bio.includes('dex')) {
    return 'defi';
  }
  if (bio.includes('media') || bio.includes('news') || bio.includes('podcast') ||
      bio.includes('newsletter')) {
    return 'ct';
  }
  
  // Default to ingested for unknown types
  return 'ingested';
}

const EntityTypeDetector = {
  detectEntityType,
  isKnownProtocol,
  addKnownProtocol,
  suggestBuildingCategory,
  KNOWN_PROTOCOLS,
};

export default EntityTypeDetector;
