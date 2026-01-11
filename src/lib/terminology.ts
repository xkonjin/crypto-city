/**
 * Terminology System (Issue #64)
 * 
 * Provides beginner-friendly mode without crypto jargon.
 * Allows switching between crypto terminology and classic/generic terms.
 */

// =============================================================================
// TYPES
// =============================================================================

export type TerminologyMode = 'crypto' | 'classic';

export interface TerminologySet {
  // Game mechanics
  rugPull: string;        // "Rug Pull" vs "Business Failure"
  tvl: string;            // "TVL" vs "Total Investment"
  sentiment: string;      // "Market Sentiment" vs "Market Conditions"
  yield: string;          // "Yield" vs "Income"
  airdrop: string;        // "Airdrop" vs "Bonus Grant"
  degen: string;          // "Degen" vs "High Risk"
  whale: string;          // "Whale" vs "Major Investor"
  staking: string;        // "Staking" vs "Deposit Earnings"
  liquidity: string;      // "Liquidity" vs "Available Funds"
  gas: string;            // "Gas" vs "Transaction Fee"
  wallet: string;         // "Wallet" vs "Account"
  hodl: string;           // "HODL" vs "Hold"
  fud: string;            // "FUD" vs "Negative News"
  fomo: string;           // "FOMO" vs "Fear of Missing Out"
  ngmi: string;           // "NGMI" vs "Not Good"
  wagmi: string;          // "WAGMI" vs "We'll Succeed"
  
  // Building categories
  defi: string;           // "DeFi" vs "Finance"
  nft: string;            // "NFT" vs "Digital Art"
  dao: string;            // "DAO" vs "Community Org"
  exchange: string;       // "Exchange" vs "Trading Platform"
  meme: string;           // "Meme" vs "Viral"
  stablecoin: string;     // "Stablecoin" vs "Stable Currency"
  
  // Events
  halving: string;        // "Halving" vs "Supply Reduction"
  gasSpike: string;       // "Gas Spike" vs "Transaction Fee Surge"
  bullRun: string;        // "Bull Run" vs "Market Boom"
  bearMarket: string;     // "Bear Market" vs "Market Downturn"
  whaleEntry: string;     // "Whale Entry" vs "Major Investment"
  
  // Tier names
  retailTier: string;     // "Retail" vs "Standard"
  degenTier: string;      // "Degen" vs "High Risk"
  whaleTier: string;      // "Whale" vs "Premium"
  institutionTier: string; // "Institution" vs "Corporate"
}

export interface TermTooltip {
  term: string;
  definition: string;
  example?: string;
}

// =============================================================================
// TERMINOLOGY SETS
// =============================================================================

export const CRYPTO_TERMS: TerminologySet = {
  // Game mechanics
  rugPull: 'Rug Pull',
  tvl: 'TVL',
  sentiment: 'Market Sentiment',
  yield: 'Yield',
  airdrop: 'Airdrop',
  degen: 'Degen',
  whale: 'Whale',
  staking: 'Staking',
  liquidity: 'Liquidity',
  gas: 'Gas',
  wallet: 'Wallet',
  hodl: 'HODL',
  fud: 'FUD',
  fomo: 'FOMO',
  ngmi: 'NGMI',
  wagmi: 'WAGMI',
  
  // Building categories
  defi: 'DeFi',
  nft: 'NFT',
  dao: 'DAO',
  exchange: 'Exchange',
  meme: 'Meme',
  stablecoin: 'Stablecoin',
  
  // Events
  halving: 'Halving',
  gasSpike: 'Gas Spike',
  bullRun: 'Bull Run',
  bearMarket: 'Bear Market',
  whaleEntry: 'Whale Entry',
  
  // Tier names
  retailTier: 'Retail',
  degenTier: 'Degen',
  whaleTier: 'Whale',
  institutionTier: 'Institution',
};

export const CLASSIC_TERMS: TerminologySet = {
  // Game mechanics
  rugPull: 'Business Failure',
  tvl: 'Total Investment',
  sentiment: 'Market Conditions',
  yield: 'Income',
  airdrop: 'Bonus Grant',
  degen: 'High Risk',
  whale: 'Major Investor',
  staking: 'Deposit Earnings',
  liquidity: 'Available Funds',
  gas: 'Transaction Fee',
  wallet: 'Account',
  hodl: 'Hold',
  fud: 'Negative News',
  fomo: 'Fear of Missing Out',
  ngmi: 'Not Good',
  wagmi: "We'll Succeed",
  
  // Building categories
  defi: 'Finance',
  nft: 'Digital Art',
  dao: 'Community Org',
  exchange: 'Trading Platform',
  meme: 'Viral',
  stablecoin: 'Stable Currency',
  
  // Events
  halving: 'Supply Reduction',
  gasSpike: 'Fee Surge',
  bullRun: 'Market Boom',
  bearMarket: 'Market Downturn',
  whaleEntry: 'Major Investment',
  
  // Tier names
  retailTier: 'Standard',
  degenTier: 'High Risk',
  whaleTier: 'Premium',
  institutionTier: 'Corporate',
};

// =============================================================================
// CRYPTO TOOLTIPS (for educational purposes)
// =============================================================================

export const CRYPTO_TOOLTIPS: Record<keyof TerminologySet, TermTooltip> = {
  rugPull: {
    term: 'Rug Pull',
    definition: 'When a crypto project suddenly fails or developers abandon it, taking investors\' money with them.',
    example: 'Your Degen Lounge got rugged - the founders ran off!',
  },
  tvl: {
    term: 'TVL (Total Value Locked)',
    definition: 'The total amount of money deposited in a DeFi protocol. Higher TVL usually means more trust.',
    example: 'This exchange has $10M TVL - pretty solid!',
  },
  sentiment: {
    term: 'Market Sentiment',
    definition: 'The overall mood of investors - are they feeling greedy (bullish) or fearful (bearish)?',
    example: 'Sentiment is at 80 (Extreme Greed) - be careful!',
  },
  yield: {
    term: 'Yield',
    definition: 'Passive income generated by your crypto holdings, like interest on a savings account.',
    example: 'This staking pool generates 5% yield per day.',
  },
  airdrop: {
    term: 'Airdrop',
    definition: 'Free tokens distributed to users, often as a reward for early participation.',
    example: 'You received an airdrop of 1000 tokens!',
  },
  degen: {
    term: 'Degen',
    definition: 'Short for "degenerate" - describes high-risk, high-reward crypto trading behavior.',
    example: 'Degen buildings have high yields but can get rugged easily.',
  },
  whale: {
    term: 'Whale',
    definition: 'An individual or entity holding large amounts of cryptocurrency that can influence markets.',
    example: 'A whale just dumped their tokens, crashing the price.',
  },
  staking: {
    term: 'Staking',
    definition: 'Locking up your crypto to support a blockchain network in exchange for rewards.',
    example: 'Stake your tokens to earn passive income.',
  },
  liquidity: {
    term: 'Liquidity',
    definition: 'How easily an asset can be bought or sold without affecting its price.',
    example: 'Low liquidity means big price swings when trading.',
  },
  gas: {
    term: 'Gas',
    definition: 'The fee paid to process transactions on a blockchain like Ethereum.',
    example: 'Gas fees are high today - wait for off-peak hours.',
  },
  wallet: {
    term: 'Wallet',
    definition: 'A digital tool for storing, sending, and receiving cryptocurrency.',
    example: 'Connect your wallet to start playing.',
  },
  hodl: {
    term: 'HODL',
    definition: 'A misspelling of "hold" that became crypto slang for holding onto assets through volatility.',
    example: 'Diamond hands HODL through the dip!',
  },
  fud: {
    term: 'FUD',
    definition: 'Fear, Uncertainty, and Doubt - negative news or rumors that can affect prices.',
    example: 'Ignore the FUD and focus on fundamentals.',
  },
  fomo: {
    term: 'FOMO',
    definition: 'Fear Of Missing Out - the anxiety of missing a profitable opportunity.',
    example: "Don't FOMO into pumping coins at the top.",
  },
  ngmi: {
    term: 'NGMI',
    definition: '"Not Gonna Make It" - crypto slang for bad decisions or unfortunate outcomes.',
    example: 'Sold at the bottom? NGMI.',
  },
  wagmi: {
    term: 'WAGMI',
    definition: '"We\'re All Gonna Make It" - optimistic crypto community rallying cry.',
    example: 'Stay strong, WAGMI!',
  },
  defi: {
    term: 'DeFi',
    definition: 'Decentralized Finance - financial services built on blockchain without traditional banks.',
    example: 'DeFi buildings generate passive yield.',
  },
  nft: {
    term: 'NFT',
    definition: 'Non-Fungible Token - unique digital assets representing ownership of items like art.',
    example: 'Your NFT gallery attracts art collectors.',
  },
  dao: {
    term: 'DAO',
    definition: 'Decentralized Autonomous Organization - a community-governed entity using blockchain.',
    example: 'Join the DAO to vote on city decisions.',
  },
  exchange: {
    term: 'Exchange',
    definition: 'A platform where you can buy, sell, and trade cryptocurrencies.',
    example: 'Build an exchange to increase trading volume.',
  },
  meme: {
    term: 'Meme',
    definition: 'Cryptocurrencies inspired by internet memes, often volatile but community-driven.',
    example: 'Meme coins are high risk but can moon!',
  },
  stablecoin: {
    term: 'Stablecoin',
    definition: 'A cryptocurrency designed to maintain a stable value, usually pegged to USD.',
    example: 'Stablecoin buildings provide steady income.',
  },
  halving: {
    term: 'Halving',
    definition: "An event that cuts the rate of new cryptocurrency creation in half, often affecting price.",
    example: 'The halving reduced mining rewards by 50%.',
  },
  gasSpike: {
    term: 'Gas Spike',
    definition: 'A sudden increase in blockchain transaction fees due to high network demand.',
    example: 'Gas spike! Building costs increased temporarily.',
  },
  bullRun: {
    term: 'Bull Run',
    definition: 'A period of rising prices and optimistic market sentiment.',
    example: 'Bull run activated! All yields doubled!',
  },
  bearMarket: {
    term: 'Bear Market',
    definition: 'A period of declining prices and pessimistic market sentiment.',
    example: 'Bear market - time to build and accumulate.',
  },
  whaleEntry: {
    term: 'Whale Entry',
    definition: 'When a major investor makes a large purchase, often boosting prices.',
    example: 'Whale entry detected - prices pumping!',
  },
  retailTier: {
    term: 'Retail',
    definition: 'Individual investors with smaller amounts of capital.',
    example: 'Retail tier buildings are safe and affordable.',
  },
  degenTier: {
    term: 'Degen',
    definition: 'High-risk traders seeking maximum returns regardless of risk.',
    example: 'Degen tier buildings have 2x yield but higher rug risk.',
  },
  whaleTier: {
    term: 'Whale',
    definition: 'Major players with significant capital and market influence.',
    example: 'Whale tier buildings require large investments.',
  },
  institutionTier: {
    term: 'Institution',
    definition: 'Large organizations like hedge funds or corporations.',
    example: 'Institution tier buildings are most stable.',
  },
};

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

const STORAGE_KEY = 'cryptocity-terminology-mode';
const ONBOARDING_KEY = 'cryptocity-terminology-onboarding-shown';

let currentMode: TerminologyMode = 'crypto';
let listeners: Array<(mode: TerminologyMode) => void> = [];

/**
 * Initialize terminology system from localStorage
 */
export function initTerminology(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'classic' || stored === 'crypto') {
      currentMode = stored;
    }
  } catch (e) {
    console.error('[Terminology] Failed to load mode from storage:', e);
  }
}

/**
 * Get the current terminology mode
 */
export function getMode(): TerminologyMode {
  return currentMode;
}

/**
 * Set the terminology mode
 */
export function setMode(mode: TerminologyMode): void {
  currentMode = mode;
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
      // Dispatch event for components to react
      window.dispatchEvent(new CustomEvent('terminology-mode-change', { detail: mode }));
    } catch (e) {
      console.error('[Terminology] Failed to save mode to storage:', e);
    }
  }
  
  // Notify listeners
  listeners.forEach(listener => listener(mode));
}

/**
 * Subscribe to terminology mode changes
 */
export function subscribe(listener: (mode: TerminologyMode) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

/**
 * Get a term based on current mode
 */
export function getTerm(key: keyof TerminologySet): string {
  const terms = currentMode === 'crypto' ? CRYPTO_TERMS : CLASSIC_TERMS;
  return terms[key];
}

/**
 * Get all terms for current mode
 */
export function getTerms(): TerminologySet {
  return currentMode === 'crypto' ? CRYPTO_TERMS : CLASSIC_TERMS;
}

/**
 * Get tooltip for a crypto term (only shown in crypto mode)
 */
export function getTooltip(key: keyof TerminologySet): TermTooltip | null {
  if (currentMode !== 'crypto') return null;
  return CRYPTO_TOOLTIPS[key] || null;
}

/**
 * Check if onboarding has been shown
 */
export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return true;
  }
}

/**
 * Mark onboarding as shown
 */
export function markOnboardingShown(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (e) {
    console.error('[Terminology] Failed to save onboarding state:', e);
  }
}

/**
 * Check if this is a first-time player (no saved data)
 */
export function isFirstTimePlayer(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check various indicators of existing play
    const hasMode = localStorage.getItem(STORAGE_KEY) !== null;
    const hasOnboarding = localStorage.getItem(ONBOARDING_KEY) === 'true';
    const hasSave = localStorage.getItem('isocity-game-state') !== null || 
                    localStorage.getItem('cryptocity-save') !== null;
    const hasTutorial = localStorage.getItem('cryptocity-tutorial-dismissed') !== null;
    
    return !hasMode && !hasOnboarding && !hasSave && !hasTutorial;
  } catch {
    return false;
  }
}

/**
 * Translate a message by replacing crypto terms with classic equivalents
 * Used for dynamic text like Cobie narrator messages
 */
export function translateMessage(message: string): string {
  if (currentMode === 'crypto') return message;
  
  // Map of crypto terms to their classic replacements
  const replacements: Array<[RegExp, string]> = [
    [/\brug(ged)?\b/gi, 'failed'],
    [/\brug pull(s)?\b/gi, 'business failure$1'],
    [/\bNGMI\b/g, 'Not good'],
    [/\bWAGMI\b/g, "We'll make it"],
    [/\bdiamond hands\b/gi, 'staying strong'],
    [/\bHODL\b/g, 'hold'],
    [/\bhodl(ing)?\b/gi, 'hold$1'],
    [/\bape(d)?\s*(in(to)?)?\b/gi, 'invest$1 $2'],
    [/\bDeFi\b/g, 'Finance'],
    [/\bTVL\b/g, 'Total Investment'],
    [/\byield\b/gi, 'income'],
    [/\bairdrop(s)?\b/gi, 'bonus grant$1'],
    [/\bdegen(s)?\b/gi, 'high-risk$1'],
    [/\bwhale(s)?\b/gi, 'major investor$1'],
    [/\bFUD\b/g, 'negative news'],
    [/\bFOMO\b/g, 'fear of missing out'],
    [/\bGas\b/g, 'Fee'],
    [/\bgas\b/g, 'fee'],
    [/\bgas spike(s)?\b/gi, 'fee surge$1'],
    [/\bbull run\b/gi, 'market boom'],
    [/\bbear market\b/gi, 'market downturn'],
    [/\bhalving\b/gi, 'supply reduction'],
    [/\bstaking\b/gi, 'deposit earnings'],
    [/\bliquidity\b/gi, 'available funds'],
    [/\bNFT(s)?\b/g, 'digital art$1'],
    [/\bDAO(s)?\b/g, 'community org$1'],
    [/\bstablecoin(s)?\b/gi, 'stable currency'],
    [/\bmeme coin(s)?\b/gi, 'viral token$1'],
    [/\bCT\b/g, 'social media'],
    [/\bCrypto Twitter\b/gi, 'social media'],
  ];
  
  let result = message;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  
  return result;
}

// Initialize on module load (client-side)
if (typeof window !== 'undefined') {
  initTerminology();
  
  // Listen for storage events (for multi-tab sync)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      if (e.newValue === 'crypto' || e.newValue === 'classic') {
        currentMode = e.newValue;
        listeners.forEach(listener => listener(currentMode));
      }
    }
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

const terminologyModule = {
  getMode,
  setMode,
  getTerm,
  getTerms,
  getTooltip,
  subscribe,
  hasSeenOnboarding,
  markOnboardingShown,
  isFirstTimePlayer,
  translateMessage,
  CRYPTO_TERMS,
  CLASSIC_TERMS,
  CRYPTO_TOOLTIPS,
};

export default terminologyModule;
