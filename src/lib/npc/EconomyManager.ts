/**
 * EconomyManager - Manages NPC wallets, income, expenses, and trading
 * 
 * This manager handles:
 * - Wallet operations (balance, deposit, withdraw)
 * - Income calculations and payment
 * - Expense calculations and payment
 * - Trading decisions based on personality
 * - Staking operations and rewards
 * - Daily economy cycle processing
 * 
 * "The market can stay irrational longer than you can stay solvent." - Keynes
 * The NPCs of Crypto City embody this wisdom daily.
 */

import type { CryptoNPC, Occupation } from '@/games/isocity/types/npc';
import type {
  NPCWallet,
  NPCFinances,
  TradeDecision,
  MarketData,
  ExpenseTier,
  StakedPosition,
} from './economy';
import {
  createDefaultWallet,
  createDefaultFinances,
  createStakedPosition,
  SALARY_RANGES,
  EXPENSE_TIERS,
} from './economy';

/**
 * EconomyManager handles all economic operations for NPCs.
 */
export class EconomyManager {
  // ==========================================
  // WALLET OPERATIONS
  // ==========================================

  /**
   * Get the cash balance of an NPC.
   * 
   * @param npc - The NPC to check
   * @returns Cash balance in stablecoins
   */
  getBalance(npc: CryptoNPC): number {
    return npc.wallet?.cash ?? 0;
  }

  /**
   * Get the total net worth of an NPC including holdings.
   * 
   * @param npc - The NPC to evaluate
   * @param prices - Current token prices
   * @returns Total net worth in stablecoins
   */
  getNetWorth(npc: CryptoNPC, prices: Record<string, number> = {}): number {
    if (!npc.wallet) return 0;

    let netWorth = npc.wallet.cash;

    // Add value of token holdings
    for (const [token, amount] of Object.entries(npc.wallet.holdings)) {
      const price = prices[token] ?? 0;
      netWorth += amount * price;
    }

    // Add value of staked positions
    for (const position of npc.wallet.stakedPositions) {
      const price = prices[position.token] ?? 0;
      netWorth += position.amount * price;
    }

    return netWorth;
  }

  /**
   * Deposit cash into an NPC's wallet.
   * 
   * @param npc - The NPC to deposit to
   * @param amount - Amount to deposit
   */
  deposit(npc: CryptoNPC, amount: number): void {
    if (!npc.wallet) {
      npc.wallet = createDefaultWallet();
    }
    npc.wallet.cash += amount;
  }

  /**
   * Withdraw cash from an NPC's wallet.
   * 
   * @param npc - The NPC to withdraw from
   * @param amount - Amount to withdraw
   * @returns true if successful, false if insufficient funds
   */
  withdraw(npc: CryptoNPC, amount: number): boolean {
    if (!npc.wallet || npc.wallet.cash < amount) {
      return false;
    }
    npc.wallet.cash -= amount;
    return true;
  }

  // ==========================================
  // INCOME OPERATIONS
  // ==========================================

  /**
   * Calculate the daily income for an NPC.
   * 
   * @param npc - The NPC to calculate income for
   * @returns Daily income in stablecoins
   */
  calculateDailyIncome(npc: CryptoNPC): number {
    if (!npc.finances) return 0;

    return npc.finances.salary + npc.finances.tradingProfits + npc.finances.stakingRewards;
  }

  /**
   * Pay the NPC their daily income.
   * Called once per game day.
   * 
   * @param npc - The NPC to pay
   */
  payDay(npc: CryptoNPC): void {
    const income = this.calculateDailyIncome(npc);
    this.deposit(npc, income);
  }

  // ==========================================
  // EXPENSE OPERATIONS
  // ==========================================

  /**
   * Calculate daily expenses for an NPC.
   * 
   * @param npc - The NPC to calculate expenses for
   * @returns Daily expenses in stablecoins
   */
  calculateDailyExpenses(npc: CryptoNPC): number {
    if (!npc.finances) return 0;

    return (
      npc.finances.housing +
      npc.finances.food +
      npc.finances.entertainment +
      npc.finances.taxes
    );
  }

  /**
   * Pay the NPC's daily expenses.
   * 
   * @param npc - The NPC to pay expenses for
   * @returns true if paid successfully, false if broke
   */
  payExpenses(npc: CryptoNPC): boolean {
    const expenses = this.calculateDailyExpenses(npc);
    return this.withdraw(npc, expenses);
  }

  // ==========================================
  // TRADING OPERATIONS
  // ==========================================

  /**
   * Buy tokens with cash.
   * 
   * @param npc - The NPC buying
   * @param token - Token symbol to buy
   * @param amount - Amount of tokens to buy
   * @param price - Price per token
   * @returns true if successful, false if insufficient funds
   */
  buyToken(
    npc: CryptoNPC,
    token: string,
    amount: number,
    price: number
  ): boolean {
    if (!npc.wallet) {
      npc.wallet = createDefaultWallet();
    }

    const totalCost = amount * price;
    if (npc.wallet.cash < totalCost) {
      return false;
    }

    npc.wallet.cash -= totalCost;
    npc.wallet.holdings[token] = (npc.wallet.holdings[token] ?? 0) + amount;
    return true;
  }

  /**
   * Sell tokens for cash.
   * 
   * @param npc - The NPC selling
   * @param token - Token symbol to sell
   * @param amount - Amount of tokens to sell
   * @param price - Price per token
   * @returns true if successful, false if insufficient holdings
   */
  sellToken(
    npc: CryptoNPC,
    token: string,
    amount: number,
    price: number
  ): boolean {
    if (!npc.wallet) return false;

    const currentHolding = npc.wallet.holdings[token] ?? 0;
    if (currentHolding < amount) {
      return false;
    }

    npc.wallet.holdings[token] = currentHolding - amount;
    npc.wallet.cash += amount * price;
    return true;
  }

  /**
   * Determine if an NPC should make a trade based on personality and market conditions.
   * 
   * This is where the crypto personality traits shine:
   * - High FOMO + bullish market = buying spree
   * - High risk tolerance + big dip = "buying the dip"
   * - Low risk tolerance + bearish market = panic sell
   * 
   * @param npc - The NPC considering a trade
   * @param market - Current market data
   * @returns TradeDecision or null if no trade
   */
  shouldTrade(npc: CryptoNPC, market: MarketData): TradeDecision | null {
    if (!npc.wallet || !npc.personality) return null;

    const { crypto } = npc.personality;
    const { sentiment, changes24h, prices } = market;

    // High FOMO + bullish market = buy
    if (crypto.fomo > 0.7 && sentiment === 'bullish') {
      if (npc.wallet.cash > 100) {
        const buyAmount = npc.wallet.cash * 0.3;
        // Pick a token with positive momentum
        const bullishToken = Object.entries(changes24h).find(([_, change]) => change > 0);
        const token = bullishToken ? bullishToken[0] : 'ETH';
        return {
          action: 'buy',
          token,
          amount: buyAmount,
          reason: 'FOMO buying - everyone else is making money!',
        };
      }
    }

    // High risk tolerance + big drop = buy the dip
    if (crypto.riskTolerance > 0.8) {
      const bigDrop = Object.entries(changes24h).find(([_, change]) => change < -15);
      if (bigDrop && npc.wallet.cash > 50) {
        const buyAmount = npc.wallet.cash * 0.5;
        return {
          action: 'buy',
          token: bigDrop[0],
          amount: buyAmount,
          reason: 'Buying the dip - blood in the streets!',
        };
      }
    }

    // Low risk tolerance + bearish market = panic sell
    if (crypto.riskTolerance < 0.3 && sentiment === 'bearish') {
      // Find a holding to panic sell
      const holdingEntry = Object.entries(npc.wallet.holdings).find(
        ([_, amount]) => amount > 0
      );
      if (holdingEntry) {
        const [token, amount] = holdingEntry;
        return {
          action: 'sell',
          token,
          amount: amount * 0.5, // Sell half in panic
          reason: 'panic selling - need to preserve capital!',
        };
      }
    }

    // High degen level + any opportunity
    if (crypto.degenLevel > 0.8 && npc.wallet.cash > 200) {
      const randomToken = Object.keys(prices)[Math.floor(Math.random() * Object.keys(prices).length)] ?? 'ETH';
      return {
        action: 'buy',
        token: randomToken,
        amount: npc.wallet.cash * 0.4,
        reason: 'YOLO - ape mode activated!',
      };
    }

    return null;
  }

  // ==========================================
  // STAKING OPERATIONS
  // ==========================================

  /**
   * Stake tokens in a protocol.
   * 
   * @param npc - The NPC staking
   * @param token - Token to stake
   * @param amount - Amount to stake
   * @param protocol - Protocol name
   * @param apy - Annual percentage yield
   * @returns true if successful, false if insufficient holdings
   */
  stake(
    npc: CryptoNPC,
    token: string,
    amount: number,
    protocol: string,
    apy: number
  ): boolean {
    if (!npc.wallet) {
      npc.wallet = createDefaultWallet();
    }

    const currentHolding = npc.wallet.holdings[token] ?? 0;
    if (currentHolding < amount) {
      return false;
    }

    // Move from holdings to staked
    npc.wallet.holdings[token] = currentHolding - amount;
    npc.wallet.stakedPositions.push(
      createStakedPosition(token, amount, protocol, apy)
    );
    return true;
  }

  /**
   * Unstake tokens from a position.
   * 
   * @param npc - The NPC unstaking
   * @param positionIndex - Index of the position to unstake
   * @returns true if successful, false if invalid index
   */
  unstake(npc: CryptoNPC, positionIndex: number): boolean {
    if (!npc.wallet || positionIndex < 0 || positionIndex >= npc.wallet.stakedPositions.length) {
      return false;
    }

    const position = npc.wallet.stakedPositions[positionIndex];
    
    // Move back to holdings
    npc.wallet.holdings[position.token] = (npc.wallet.holdings[position.token] ?? 0) + position.amount;
    
    // Remove the position
    npc.wallet.stakedPositions.splice(positionIndex, 1);
    return true;
  }

  /**
   * Calculate staking rewards for all positions.
   * 
   * @param npc - The NPC to calculate rewards for
   * @param prices - Current token prices
   * @returns Total daily rewards in stablecoins
   */
  calculateStakingRewards(npc: CryptoNPC, prices: Record<string, number> = {}): number {
    if (!npc.wallet) return 0;

    let totalRewards = 0;
    const now = Date.now();

    for (const position of npc.wallet.stakedPositions) {
      const price = prices[position.token] ?? 0;
      const value = position.amount * price;
      
      // Calculate days staked
      const msStaked = now - position.stakedAt;
      const daysStaked = msStaked / (1000 * 60 * 60 * 24);
      
      // APY to daily rate: dailyRate = APY / 365
      const dailyRate = position.apy / 100 / 365;
      
      // Rewards for time staked (simplified - not compound)
      totalRewards += value * dailyRate * daysStaked;
    }

    return totalRewards;
  }

  // ==========================================
  // DAILY CYCLE
  // ==========================================

  /**
   * Process the daily economy cycle for an NPC.
   * This handles income, expenses, and updates net worth.
   * 
   * @param npc - The NPC to process
   * @param prices - Current token prices (optional)
   */
  processDailyEconomyCycle(npc: CryptoNPC, prices: Record<string, number> = {}): void {
    // Ensure wallet and finances exist
    if (!npc.wallet) {
      npc.wallet = createDefaultWallet();
    }
    if (!npc.finances) {
      npc.finances = createDefaultFinances(npc.occupation);
    }

    // Calculate and add staking rewards to finances
    const stakingRewards = this.calculateStakingRewards(npc, prices);
    npc.finances.stakingRewards = stakingRewards;

    // Pay income
    this.payDay(npc);

    // Pay expenses (may fail if broke)
    this.payExpenses(npc);

    // Update calculated values
    npc.finances.netWorth = this.getNetWorth(npc, prices);
    npc.finances.dailyNet = this.calculateDailyIncome(npc) - this.calculateDailyExpenses(npc);
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  /**
   * Initialize a wallet for a specific occupation.
   * Different occupations start with different amounts.
   * 
   * @param occupation - The NPC's occupation
   * @returns Initialized wallet
   */
  initializeWalletForOccupation(occupation: Occupation): NPCWallet {
    const salaryRange = SALARY_RANGES[occupation];
    
    // Start with 5-15 days worth of salary
    const salaryMultiplier = 5 + Math.random() * 10;
    const avgSalary = (salaryRange.min + salaryRange.max) / 2;
    const startingCash = Math.round(avgSalary * salaryMultiplier);

    const wallet = createDefaultWallet(startingCash);

    // Developers might start with some ETH
    if (occupation === 'developer' && Math.random() > 0.5) {
      wallet.holdings['ETH'] = 0.1 + Math.random() * 0.5;
    }

    // Traders might have diverse holdings
    if (occupation === 'trader' && Math.random() > 0.3) {
      wallet.holdings['BTC'] = 0.01 + Math.random() * 0.05;
      wallet.holdings['ETH'] = 0.1 + Math.random() * 0.3;
    }

    // Miners might have BTC
    if (occupation === 'miner' && Math.random() > 0.4) {
      wallet.holdings['BTC'] = 0.005 + Math.random() * 0.02;
    }

    return wallet;
  }

  // ==========================================
  // LIFESTYLE TIER
  // ==========================================

  /**
   * Get the lifestyle tier for an NPC based on income.
   * 
   * @param npc - The NPC to evaluate
   * @returns ExpenseTier
   */
  getLifestyleTier(npc: CryptoNPC): ExpenseTier {
    const income = this.calculateDailyIncome(npc);

    if (income >= 400) {
      return 'lavish';
    } else if (income >= 150) {
      return 'moderate';
    } else {
      return 'frugal';
    }
  }

  // ==========================================
  // TRADING PROFITS
  // ==========================================

  /**
   * Record a trading profit (or loss) for an NPC.
   * 
   * @param npc - The NPC
   * @param profit - Profit amount (negative for loss)
   */
  recordTradingProfit(npc: CryptoNPC, profit: number): void {
    if (!npc.finances) {
      npc.finances = createDefaultFinances(npc.occupation);
    }
    npc.finances.tradingProfits += profit;
  }
}
