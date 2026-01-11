/**
 * NPC Name Generator for Crypto City
 * 
 * Generates crypto-themed names for NPCs like:
 * - Satoshi_Maxi_42
 * - HODL_Queen
 * - Degen_Dave
 * - CryptoChad_69
 */

// Crypto-themed prefixes
const PREFIXES = [
  'Crypto', 'Blockchain', 'Degen', 'HODL', 'Moon',
  'Diamond', 'Paper', 'Ape', 'Bull', 'Bear',
  'Whale', 'Shrimp', 'Satoshi', 'Vitalik', 'Pepe',
  'Wojak', 'Chad', 'Based', 'Rekt', 'Fomo',
  'Pump', 'Dump', 'Yield', 'DeFi', 'NFT',
  'Web3', 'DAO', 'Gas', 'Mint', 'Burn',
  'Stack', 'Sats', 'Gwei', 'Hash', 'Node',
  'Ledger', 'Cold', 'Hot', 'Seed', 'Key'
];

// Names to combine with prefixes
const NAMES = [
  'Dave', 'Mike', 'Chad', 'Karen', 'Brad',
  'Steve', 'Alex', 'Sam', 'Max', 'Kai',
  'Quinn', 'Jordan', 'Taylor', 'Morgan', 'Casey',
  'Riley', 'Avery', 'Phoenix', 'River', 'Sky',
  'Storm', 'Wolf', 'Hawk', 'Fox', 'Bear'
];

// Title/role suffixes
const SUFFIXES = [
  'King', 'Queen', 'Lord', 'Master', 'Wizard',
  'Guru', 'Pro', 'Maxi', 'Chad', 'Legend',
  'Ape', 'Whale', 'Degen', 'Holder', 'Staker',
  'Miner', 'Trader', 'Builder', 'Anon', 'OG'
];

// Additional crypto slang terms for variation
const CRYPTO_TERMS = [
  'WAGMI', 'NGMI', 'LFG', 'GM', 'GN',
  '1000x', '100x', 'Moonshot', 'Lambo', 'Wen',
  'Ser', 'Fren', 'Anon', 'Gigabrain', 'Smolbrain'
];

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random element from an array
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a crypto-themed NPC name
 * 
 * Formats:
 * 1. Prefix_Name_Number (e.g., "Crypto_Dave_42")
 * 2. Prefix_Suffix (e.g., "HODL_King")
 * 3. Name_Suffix_Number (e.g., "Chad_Maxi_69")
 * 4. CryptoTerm_Name (e.g., "WAGMI_Steve")
 * 5. Prefix_CryptoTerm (e.g., "Diamond_WAGMI")
 */
export function generateNPCName(): string {
  const format = randomInt(1, 5);
  
  switch (format) {
    case 1: {
      // Prefix_Name_Number
      const prefix = randomPick(PREFIXES);
      const name = randomPick(NAMES);
      const number = randomInt(1, 99);
      return `${prefix}_${name}_${number}`;
    }
    case 2: {
      // Prefix_Suffix
      const prefix = randomPick(PREFIXES);
      const suffix = randomPick(SUFFIXES);
      return `${prefix}_${suffix}`;
    }
    case 3: {
      // Name_Suffix_Number
      const name = randomPick(NAMES);
      const suffix = randomPick(SUFFIXES);
      const number = randomInt(1, 99);
      return `${name}_${suffix}_${number}`;
    }
    case 4: {
      // CryptoTerm_Name
      const term = randomPick(CRYPTO_TERMS);
      const name = randomPick(NAMES);
      return `${term}_${name}`;
    }
    case 5:
    default: {
      // Prefix_CryptoTerm
      const prefix = randomPick(PREFIXES);
      const term = randomPick(CRYPTO_TERMS);
      return `${prefix}_${term}`;
    }
  }
}

/**
 * Generate a simulated wallet address
 * Format: 0x followed by 40 hex characters
 */
export function generateWalletAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Generate a batch of unique names
 * 
 * @param count Number of names to generate
 * @param maxAttempts Maximum attempts to avoid duplicates
 * @returns Array of unique names
 */
export function generateUniqueNames(count: number, maxAttempts: number = 1000): string[] {
  const names = new Set<string>();
  let attempts = 0;
  
  while (names.size < count && attempts < maxAttempts) {
    names.add(generateNPCName());
    attempts++;
  }
  
  return Array.from(names);
}
