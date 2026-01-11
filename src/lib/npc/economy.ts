/**
 * NPC Economy System Types and Constants
 * 
 * Implements wallet, finances, trading, and staking systems for NPCs.
 * All values are in stablecoin units (think USDT/USDC).
 * 
 * "The economy is a wholly owned subsidiary of the environment." - Herman Daly
 * Though in Crypto City, the environment is a wholly owned subsidiary of charts.
 */

import type { Occupation } from '@/games/isocity/types/npc';

/**
 * NPC Wallet - holds cash and token holdings.
 * 
 * Every citizen of Crypto City has a wallet. Some are fat, most are thin,
 * and all are checking them every 30 seconds.
 */
export interface NPCWallet {
  /** Stablecoin balance - the "safe" money (ha!) */
  cash: number;
  /** Token holdings by symbol - e.g., { "BTC": 0.5, "ETH": 2.0 } */
  holdings: Record<string, number>;
  /** Active staking positions - money working while you sleep */
  stakedPositions: StakedPosition[];
}

/**
 * A staking position - tokens locked up for yield.
 * 
 * The crypto equivalent of putting your money in a savings account,
 * except the bank might explode at any moment.
 */
export interface StakedPosition {
  /** The token being staked */
  token: string;
  /** Amount of tokens staked */
  amount: number;
  /** Protocol name (e.g., "Lido", "Rocket Pool") */
  protocol: string;
  /** Annual Percentage Yield - usually too good to be true */
  apy: number;
  /** Timestamp when staking began */
  stakedAt: number;
}

/**
 * NPC Finances - income and expenses tracking.
 * 
 * The spreadsheet of existence. Numbers go up, numbers go down.
 * Can't explain that.
 */
export interface NPCFinances {
  // === INCOME (per game day) ===
  /** Regular employment income */
  salary: number;
  /** Profits (or losses) from trading activity */
  tradingProfits: number;
  /** Rewards from staked positions */
  stakingRewards: number;
  
  // === EXPENSES (per game day) ===
  /** Housing costs - roof over head */
  housing: number;
  /** Food costs - fuel for the degen */
  food: number;
  /** Entertainment costs - because life isn't all charts */
  entertainment: number;
  /** Taxes - the only certainty besides rug pulls */
  taxes: number;
  
  // === CALCULATED VALUES ===
  /** Total value of all assets */
  netWorth: number;
  /** Daily income minus daily expenses */
  dailyNet: number;
}

/**
 * Trading decision output from shouldTrade().
 */
export interface TradeDecision {
  /** What to do */
  action: 'buy' | 'sell' | 'hold';
  /** Which token */
  token: string;
  /** How much (in tokens for sell, in cash for buy) */
  amount: number;
  /** Why this decision was made */
  reason: string;
}

/**
 * Market data for trading decisions.
 */
export interface MarketData {
  /** Current prices by token symbol */
  prices: Record<string, number>;
  /** 24h price changes (percentage) by token symbol */
  changes24h: Record<string, number>;
  /** Overall market sentiment */
  sentiment: 'bullish' | 'neutral' | 'bearish';
}

/**
 * Lifestyle expense tier.
 */
export type ExpenseTier = 'frugal' | 'moderate' | 'lavish';

/**
 * Salary ranges by occupation (per game day).
 * 
 * The great wheel of capitalism spins, distributing tokens
 * according to what society values, which is mostly confused.
 */
export const SALARY_RANGES: Record<Occupation, { min: number; max: number }> = {
  trader: { min: 100, max: 500 },      // High variance, high stress
  miner: { min: 80, max: 200 },        // Steady but sweaty
  developer: { min: 150, max: 400 },   // Well paid but shipping late
  shop_owner: { min: 50, max: 300 },   // Depends on foot traffic
  bartender: { min: 40, max: 100 },    // Tips not included
  artist: { min: 20, max: 400 },       // Feast or famine, mostly famine
  security: { min: 60, max: 120 },     // Consistent but modest
  unemployed: { min: 0, max: 0 },      // Between opportunities
};

/**
 * Living expense tiers - how much it costs to exist.
 * 
 * You can live like a monk or a king, but either way
 * you're still checking prices on the toilet.
 */
export const EXPENSE_TIERS: Record<ExpenseTier, { housing: number; food: number; entertainment: number }> = {
  frugal: { housing: 20, food: 10, entertainment: 5 },
  moderate: { housing: 50, food: 25, entertainment: 20 },
  lavish: { housing: 150, food: 60, entertainment: 80 },
};

/**
 * Hitchhiker's Guide to the Galaxy style descriptions for economy concepts.
 * 
 * Providing sardonic wisdom about the financial systems that govern
 * the daily lives of Crypto City's citizens.
 */
export const ECONOMY_DESCRIPTIONS: Record<string, string> = {
  salary: "The regular income that allows one to buy more volatile assets. Irony noted.",
  staking: "Locking up tokens in hopes of more tokens. Like a savings account, but with more existential risk.",
  trading: "The art of buying high and selling low, perfected over generations of crypto enthusiasts.",
  expenses: "The necessary evil of paying for things that don't appreciate in value. Very wasteful.",
  netWorth: "A number that determines your worth as a human. Very healthy system.",
  broke: "The natural state between airdrops. Character building, they say.",
  wallet: "A digital container for hopes, dreams, and depreciating assets.",
  holdings: "Tokens held with diamond hands, until the next rug pull.",
  taxes: "The government's cut of your imaginary gains. Very real consequences for imaginary money.",
  diversification: "The practice of losing money across multiple assets simultaneously.",
};

/**
 * Creates a default empty wallet.
 * 
 * @param initialCash - Starting cash amount (default 0)
 * @returns A new NPCWallet
 */
export function createDefaultWallet(initialCash: number = 0): NPCWallet {
  return {
    cash: initialCash,
    holdings: {},
    stakedPositions: [],
  };
}

/**
 * Creates default finances for an occupation.
 * 
 * @param occupation - The NPC's occupation
 * @param tier - Lifestyle tier (default 'moderate')
 * @returns Initial NPCFinances
 */
export function createDefaultFinances(
  occupation: Occupation,
  tier: ExpenseTier = 'moderate'
): NPCFinances {
  const salaryRange = SALARY_RANGES[occupation];
  const salary = salaryRange.min + Math.random() * (salaryRange.max - salaryRange.min);
  const expenses = EXPENSE_TIERS[tier];
  
  const totalIncome = salary;
  const totalExpenses = expenses.housing + expenses.food + expenses.entertainment;
  const taxes = Math.max(0, totalIncome * 0.15); // 15% tax rate
  
  return {
    salary: Math.round(salary),
    tradingProfits: 0,
    stakingRewards: 0,
    housing: expenses.housing,
    food: expenses.food,
    entertainment: expenses.entertainment,
    taxes: Math.round(taxes),
    netWorth: 0,
    dailyNet: Math.round(totalIncome - totalExpenses - taxes),
  };
}

/**
 * Creates a staked position.
 * 
 * @param token - Token symbol
 * @param amount - Amount staked
 * @param protocol - Protocol name
 * @param apy - Annual percentage yield
 * @returns A new StakedPosition
 */
export function createStakedPosition(
  token: string,
  amount: number,
  protocol: string,
  apy: number
): StakedPosition {
  return {
    token,
    amount,
    protocol,
    apy,
    stakedAt: Date.now(),
  };
}
