/**
 * NPC Wallet Manager
 * 
 * Manages HD wallet derivation and on-chain interactions for NPCs.
 * Each NPC gets a deterministically derived wallet from a master seed.
 * 
 * "The beauty of HD wallets is that you can generate billions of addresses
 * from a single seed. The terror is that losing that seed means losing
 * billions of addresses."
 */

import { 
  createPublicClient, 
  createWalletClient, 
  http,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  formatUnits,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { 
  NPCOnChainWallet, 
  NPCWalletManagerConfig,
  PaymentResult,
} from './types';
import {
  PLASMA_TESTNET_CHAIN_ID,
  PLASMA_TESTNET_RPC_URL,
  USDT0_TESTNET_ADDRESS,
  NPC_WALLET_DERIVATION_PATH,
  NPC_BALANCE_CACHE_TTL,
} from './constants';

// ERC20 ABI for balance and transfer
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

/**
 * Simple deterministic key generation for NPCs
 * In production, use proper HD wallet derivation (ethers.js HDNode or similar)
 * 
 * This is a SIMPLIFIED version for testnet - DO NOT use in production!
 */
function derivePrivateKey(seed: string, index: number): Hex {
  // Create a deterministic hash from seed + index
  // In production, use BIP-32/BIP-44 derivation
  const encoder = new TextEncoder();
  const data = encoder.encode(`${seed}:${NPC_WALLET_DERIVATION_PATH}/${index}`);
  
  // Simple hash-based derivation (NOT cryptographically secure for production)
  let hash = BigInt(0);
  const modulus = BigInt(2) ** BigInt(256);
  for (const byte of data) {
    hash = ((hash << BigInt(8)) + BigInt(byte)) % modulus;
  }
  
  // Ensure it's a valid private key (non-zero, less than secp256k1 order)
  const order = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
  const privateKey = (hash % (order - BigInt(1))) + BigInt(1);
  
  return `0x${privateKey.toString(16).padStart(64, '0')}` as Hex;
}

/**
 * NPC Wallet Manager
 * 
 * Handles wallet creation, balance queries, and transactions for NPCs.
 */
export class NPCWalletManager {
  private config: NPCWalletManagerConfig;
  private publicClient: PublicClient;
  private wallets: Map<string, NPCOnChainWallet> = new Map();
  private nextDerivationIndex = 0;

  constructor(config: Partial<NPCWalletManagerConfig> = {}) {
    this.config = {
      seed: config.seed || process.env.NPC_WALLET_SEED || 'crypto-city-testnet-seed',
      rpcUrl: config.rpcUrl || PLASMA_TESTNET_RPC_URL,
      chainId: config.chainId || PLASMA_TESTNET_CHAIN_ID,
      usdtAddress: config.usdtAddress || USDT0_TESTNET_ADDRESS,
      enableOnChain: config.enableOnChain ?? false,
      ...config,
    };

    // Create public client for reading chain state
    this.publicClient = createPublicClient({
      transport: http(this.config.rpcUrl),
    });
  }

  /**
   * Get or create a wallet for an NPC
   */
  getOrCreateWallet(npcId: string): NPCOnChainWallet {
    const existing = this.wallets.get(npcId);
    if (existing) return existing;

    const index = this.nextDerivationIndex++;
    const privateKey = derivePrivateKey(this.config.seed!, index);
    const account = privateKeyToAccount(privateKey);

    const wallet: NPCOnChainWallet = {
      npcId,
      address: account.address,
      derivationIndex: index,
      balanceCached: BigInt(0),
      lastSynced: 0,
      isFunded: false,
    };

    this.wallets.set(npcId, wallet);
    return wallet;
  }

  /**
   * Get wallet for NPC (returns null if not created)
   */
  getWallet(npcId: string): NPCOnChainWallet | null {
    return this.wallets.get(npcId) || null;
  }

  /**
   * Get address for NPC
   */
  getAddress(npcId: string): Address | null {
    const wallet = this.wallets.get(npcId);
    return wallet?.address || null;
  }

  /**
   * Fetch on-chain USDT₮ balance for an NPC
   */
  async fetchBalance(npcId: string): Promise<bigint> {
    const wallet = this.wallets.get(npcId);
    if (!wallet) {
      throw new Error(`No wallet found for NPC: ${npcId}`);
    }

    // Check cache
    const now = Date.now();
    if (now - wallet.lastSynced < NPC_BALANCE_CACHE_TTL) {
      return wallet.balanceCached;
    }

    if (!this.config.enableOnChain) {
      // Return cached/simulated balance when not on-chain
      return wallet.balanceCached;
    }

    try {
      const balance = await this.publicClient.readContract({
        address: this.config.usdtAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [wallet.address],
      });

      wallet.balanceCached = balance as bigint;
      wallet.lastSynced = now;
      wallet.isFunded = balance > BigInt(0);

      return balance as bigint;
    } catch (error) {
      console.error(`Failed to fetch balance for ${npcId}:`, error);
      return wallet.balanceCached;
    }
  }

  /**
   * Get formatted balance (human readable)
   */
  async getFormattedBalance(npcId: string): Promise<string> {
    const balance = await this.fetchBalance(npcId);
    return formatUnits(balance, 6); // USDT has 6 decimals
  }

  /**
   * Transfer USDT₮ between NPCs (simulated or on-chain)
   */
  async transfer(
    fromNpcId: string,
    toNpcId: string,
    amount: bigint,
    reason?: string
  ): Promise<PaymentResult> {
    const fromWallet = this.wallets.get(fromNpcId);
    const toWallet = this.wallets.get(toNpcId);

    if (!fromWallet) {
      return { success: false, error: `No wallet for sender: ${fromNpcId}` };
    }
    if (!toWallet) {
      return { success: false, error: `No wallet for receiver: ${toNpcId}` };
    }

    // Check balance
    const balance = await this.fetchBalance(fromNpcId);
    if (balance < amount) {
      return { 
        success: false, 
        error: `Insufficient balance: ${formatUnits(balance, 6)} < ${formatUnits(amount, 6)}` 
      };
    }

    if (!this.config.enableOnChain) {
      // Simulated transfer - just update cached balances
      fromWallet.balanceCached -= amount;
      toWallet.balanceCached += amount;
      return { success: true };
    }

    // On-chain transfer
    try {
      const privateKey = derivePrivateKey(this.config.seed!, fromWallet.derivationIndex);
      const account = privateKeyToAccount(privateKey);

      const walletClient = createWalletClient({
        account,
        transport: http(this.config.rpcUrl),
      });

      const hash = await walletClient.writeContract({
        address: this.config.usdtAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [toWallet.address, amount],
        chain: {
          id: this.config.chainId,
          name: 'Plasma Testnet',
          nativeCurrency: { name: 'XPL', symbol: 'XPL', decimals: 18 },
          rpcUrls: { default: { http: [this.config.rpcUrl] } },
        },
      });

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      // Update cached balances
      fromWallet.balanceCached -= amount;
      toWallet.balanceCached += amount;
      fromWallet.lastSynced = 0; // Force refresh on next query
      toWallet.lastSynced = 0;

      return { 
        success: true, 
        txHash: hash,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transfer failed';
      return { success: false, error: message };
    }
  }

  /**
   * Fund an NPC wallet from treasury (for initial setup)
   */
  async fundWallet(npcId: string, amount: bigint): Promise<PaymentResult> {
    if (!this.config.treasuryAddress) {
      // Simulated funding
      const wallet = this.wallets.get(npcId);
      if (wallet) {
        wallet.balanceCached += amount;
        wallet.isFunded = true;
        return { success: true };
      }
      return { success: false, error: 'Wallet not found' };
    }

    // Real funding would require treasury private key
    // For now, just simulate
    const wallet = this.wallets.get(npcId);
    if (wallet) {
      wallet.balanceCached += amount;
      wallet.isFunded = true;
      return { success: true };
    }
    return { success: false, error: 'Wallet not found' };
  }

  /**
   * Set simulated balance (for testing)
   */
  setSimulatedBalance(npcId: string, amount: bigint): void {
    const wallet = this.wallets.get(npcId);
    if (wallet) {
      wallet.balanceCached = amount;
      wallet.isFunded = amount > BigInt(0);
    }
  }

  /**
   * Get all NPC wallets
   */
  getAllWallets(): NPCOnChainWallet[] {
    return Array.from(this.wallets.values());
  }

  /**
   * Get economy statistics
   */
  getEconomyStats(): {
    totalWallets: number;
    fundedWallets: number;
    totalCirculating: bigint;
  } {
    const wallets = this.getAllWallets();
    return {
      totalWallets: wallets.length,
      fundedWallets: wallets.filter(w => w.isFunded).length,
      totalCirculating: wallets.reduce((sum, w) => sum + w.balanceCached, BigInt(0)),
    };
  }

  /**
   * Enable/disable on-chain mode
   */
  setOnChainMode(enabled: boolean): void {
    this.config.enableOnChain = enabled;
  }

  /**
   * Check if on-chain mode is enabled
   */
  isOnChainEnabled(): boolean {
    return this.config.enableOnChain;
  }
}

// Singleton instance for global access
let walletManagerInstance: NPCWalletManager | null = null;

export function getNPCWalletManager(): NPCWalletManager {
  if (!walletManagerInstance) {
    walletManagerInstance = new NPCWalletManager();
  }
  return walletManagerInstance;
}

export function initNPCWalletManager(config: Partial<NPCWalletManagerConfig>): NPCWalletManager {
  walletManagerInstance = new NPCWalletManager(config);
  return walletManagerInstance;
}
