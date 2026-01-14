# X402 NPC Economy Integration Specification

## Overview

Integrate the **x402 payment protocol** with Crypto City's NPC system to enable autonomous agent-to-agent commerce on **Plasma testnet**. Each NPC will have a real wallet capable of sending/receiving USDT₮ payments for services, goods, and interactions.

> "In the beginning, NPCs traded virtual currencies. Then someone asked: 'What if the numbers were real?'"
> — Hitchhiker's Guide to Crypto City

## Research Summary

### X402 Protocol
- **Creator**: Coinbase Developer Platform (May 2025)
- **Purpose**: HTTP-native payments for AI agents and machines
- **Mechanism**: Uses HTTP 402 "Payment Required" status code
- **Key Features**:
  - Zero protocol fees (only network fees)
  - Instant settlement
  - No account setup required
  - Multi-chain support (Base, Solana, Ethereum, Plasma)
  - Perfect for agent-to-agent micropayments
- **SDKs**: `@x402/core`, `@x402/express`, `@x402/fetch`
- **Stats**: 75M+ transactions, $24M+ volume processed

### Plasma Testnet
- **Chain ID**: 9746 (testnet), 9745 (mainnet)
- **RPC**: `https://testnet-rpc.plasma.to`
- **Currency**: XPL (native gas), USDT₮ (stablecoin)
- **Block Time**: ~1 second
- **Features**:
  - Zero-fee USDT₮ transfers
  - EVM compatible
  - Full MetaMask/Foundry support
- **Consensus**: PlasmaBFT (Fast HotStuff variant)

## Architecture

### Current State
```
┌─────────────────────────────────────────────────────────────┐
│  NPC Economy (Simulated)                                    │
│  - NPCWallet { cash, holdings, stakedPositions }           │
│  - NPCFinances { salary, expenses, tradingProfits }        │
│  - EconomyManager (deposit, withdraw, buy/sell tokens)     │
│  - All values are SIMULATED (not on-chain)                 │
└─────────────────────────────────────────────────────────────┘
```

### Target State
```
┌─────────────────────────────────────────────────────────────┐
│  NPC X402 Economy (Real Testnet)                           │
│                                                             │
│  ┌─────────────┐    x402 HTTP    ┌─────────────┐          │
│  │  NPC Alice  │◄───────────────►│  NPC Bob    │          │
│  │  Wallet A   │   402 Required  │  Wallet B   │          │
│  │  (EOA)      │   Pay & Retry   │  (EOA)      │          │
│  └─────────────┘                 └─────────────┘          │
│         │                               │                  │
│         └───────────┬───────────────────┘                  │
│                     ▼                                       │
│           ┌─────────────────┐                              │
│           │  Plasma Testnet │                              │
│           │  (USDT₮ + XPL)  │                              │
│           └─────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

## NPC Wallet System

### Option 1: Hierarchical Deterministic (HD) Wallets
Generate all NPC wallets from a single master seed. Each NPC gets a unique derivation path.

```typescript
// Master seed controlled by game server
const MASTER_SEED = process.env.NPC_WALLET_SEED;

// Derivation: m/44'/60'/0'/0/{npcIndex}
function deriveNPCWallet(npcIndex: number): { address: Address; privateKey: Hex } {
  const hdWallet = HDKey.fromMasterSeed(MASTER_SEED);
  const derived = hdWallet.derive(`m/44'/60'/0'/0/${npcIndex}`);
  return {
    address: privateKeyToAddress(derived.privateKey),
    privateKey: derived.privateKey as Hex,
  };
}
```

**Pros**: 
- Easy to fund all wallets from one source
- Deterministic - same seed = same wallets
- Can recover all wallets from seed

**Cons**:
- Single point of failure (seed compromise)
- Server needs access to private keys

### Option 2: Burner Wallets (Recommended for Testnet)
Each NPC gets a randomly generated burner wallet stored in localStorage/server.

```typescript
interface NPCOnChainWallet {
  npcId: string;
  address: Address;
  privateKey: Hex; // Encrypted at rest
  plasmaBalance: bigint; // Cached USDT₮ balance
  lastSynced: number;
}
```

**Pros**:
- Isolated - one compromise doesn't affect others
- Simple to implement
- Good for testnet experimentation

**Cons**:
- Need to fund each wallet individually
- Keys must be stored securely

## X402 Integration for NPCs

### NPC Services (Sellers)
NPCs can offer services that other NPCs pay for:

```typescript
type NPCService = {
  serviceId: string;
  npcId: string;
  name: string;
  description: string;
  price: bigint; // In USDT₮ atomic units (6 decimals)
  endpoint: string; // HTTP endpoint requiring payment
};

const NPC_SERVICES: NPCService[] = [
  {
    serviceId: 'alpha_call',
    npcId: 'trader_001',
    name: 'Alpha Call Service',
    description: 'Get a hot trading tip (not financial advice)',
    price: 100000n, // $0.10 USDT₮
    endpoint: '/api/npc/trader_001/alpha',
  },
  {
    serviceId: 'bar_drink',
    npcId: 'bartender_001',
    name: 'Serve Drink',
    description: 'One hopium-infused cocktail',
    price: 50000n, // $0.05 USDT₮
    endpoint: '/api/npc/bartender_001/serve',
  },
  {
    serviceId: 'security_escort',
    npcId: 'security_001',
    name: 'Building Security Escort',
    description: 'Safe passage through dangerous zones',
    price: 250000n, // $0.25 USDT₮
    endpoint: '/api/npc/security_001/escort',
  },
];
```

### X402 Middleware for NPC Endpoints

```typescript
// Server-side: Each NPC has protected endpoints
import { paymentMiddleware } from '@x402/express';

const npcPaymentMiddleware = paymentMiddleware({
  'GET /api/npc/:npcId/service': {
    price: async (req) => {
      const service = getNPCService(req.params.npcId);
      return service.price;
    },
    payee: async (req) => {
      const npc = getNPC(req.params.npcId);
      return npc.wallet.address;
    },
    network: 'plasma-testnet',
    description: (req) => `Payment to NPC ${req.params.npcId}`,
  },
});
```

### NPC-to-NPC Payment Flow

```
1. NPC Alice wants service from NPC Bob (e.g., buy a drink)
   
2. Alice's agent sends HTTP request:
   GET /api/npc/bob/service/drink
   
3. Server responds with 402 Payment Required:
   {
     "x402Version": "1",
     "accepts": [{
       "network": "plasma-testnet",
       "address": "0x...", // Bob's wallet
       "asset": "USDT0",
       "amount": "50000",
       "description": "One drink from Bartender Bob"
     }]
   }
   
4. Alice's agent signs and sends payment:
   - Uses Alice's private key (server-side)
   - Sends USDT₮ to Bob's address
   - Gets transaction hash
   
5. Alice's agent retries with X-PAYMENT header:
   GET /api/npc/bob/service/drink
   X-PAYMENT: <tx-hash>
   
6. Server verifies payment on-chain, fulfills request
   
7. Bob's wallet balance increases by $0.05
```

## NPC Economic Activities

### Daily Economy Cycle
```typescript
async function dailyNPCEconomyCycle() {
  for (const npc of getAllNPCs()) {
    // 1. Receive salary (funded by city treasury)
    await payNPCSalary(npc);
    
    // 2. Pay expenses to service NPCs
    await payNPCExpenses(npc);
    
    // 3. Social interactions (optional tips/gifts)
    await processNPCSocialPayments(npc);
    
    // 4. Sync on-chain balance
    await syncNPCBalance(npc);
  }
}

async function payNPCSalary(npc: CryptoNPC): Promise<void> {
  const salary = calculateDailySalary(npc);
  // Transfer from city treasury to NPC wallet
  await transferUSDT0(CITY_TREASURY, npc.wallet.address, salary);
}

async function payNPCExpenses(npc: CryptoNPC): Promise<void> {
  // Housing: Pay landlord NPC
  if (npc.residence) {
    const landlord = getBuildingOwnerNPC(npc.residence);
    await npcPayNPC(npc, landlord, npc.finances.housing, 'rent');
  }
  
  // Food: Pay bartender/shop NPCs
  await npcPayNPC(npc, randomFoodVendor(), npc.finances.food, 'food');
  
  // Entertainment: Pay entertainment venue NPCs
  await npcPayNPC(npc, randomEntertainment(), npc.finances.entertainment, 'fun');
}
```

### Interaction-Based Payments
```typescript
// When NPCs interact, payments can occur
async function processNPCInteraction(
  initiator: CryptoNPC,
  target: CryptoNPC,
  type: InteractionType
): Promise<void> {
  switch (type) {
    case 'buy_drink':
      await npcPayNPC(initiator, target, DRINK_PRICE, 'drink');
      break;
      
    case 'tip':
      const tipAmount = calculateTip(initiator.personality);
      await npcPayNPC(initiator, target, tipAmount, 'tip');
      break;
      
    case 'hire_security':
      await npcPayNPC(initiator, target, SECURITY_FEE, 'security');
      break;
      
    case 'alpha_trade':
      await npcPayNPC(initiator, target, ALPHA_CALL_FEE, 'alpha');
      break;
  }
}
```

## Implementation Plan

### Phase 1: Testnet Infrastructure (Week 1)
1. **Setup Plasma testnet configuration**
   - Add testnet constants (`PLASMA_TESTNET_CHAIN_ID = 9746`)
   - Configure RPC endpoint
   - Test connection

2. **Create NPC wallet generator**
   - HD wallet derivation from seed
   - Secure key storage (encrypted)
   - Wallet address assignment to NPCs

3. **Faucet integration**
   - Auto-fund new NPC wallets with testnet USDT₮
   - Treasury wallet for salary distribution

### Phase 2: X402 Integration (Week 2)
1. **Install x402 packages**
   ```bash
   npm install @x402/core @x402/express @x402/fetch
   ```

2. **Create NPC service endpoints**
   - Define NPC services (drinks, alpha calls, security, etc.)
   - Add x402 payment middleware
   - Implement payment verification

3. **Create NPC payment agent**
   - Server-side module that handles NPC payments
   - Signs transactions using NPC private keys
   - Tracks payment history

### Phase 3: Economy Integration (Week 3)
1. **Modify EconomyManager**
   - Add on-chain balance tracking
   - Implement `npcPayNPC()` function
   - Sync simulated wallet with real balance

2. **Update NPCSimulation**
   - Integrate payment flows into daily cycle
   - Add payment events to NPC interactions
   - Handle payment failures gracefully

3. **Create economy visualization**
   - Show real balances in NPC info panel
   - Transaction history per NPC
   - City-wide economic dashboard

### Phase 4: Testing & Polish (Week 4)
1. **E2E tests**
   - NPC wallet creation
   - Payment flows
   - Balance synchronization

2. **Performance optimization**
   - Batch transactions where possible
   - Cache balances to reduce RPC calls
   - Handle network failures

3. **Documentation**
   - Update AGENTS.md
   - Create user guide
   - API documentation

## Technical Specifications

### New Files to Create
```
src/
├── lib/
│   └── npc/
│       ├── x402/
│       │   ├── NPCWalletManager.ts    # HD wallet generation
│       │   ├── NPCPaymentAgent.ts     # Handles NPC payments
│       │   ├── NPCServiceRegistry.ts  # Available NPC services
│       │   └── types.ts               # X402 types
│       └── economy/
│           └── OnChainEconomy.ts      # On-chain balance sync
├── app/
│   └── api/
│       └── npc/
│           └── [npcId]/
│               └── service/
│                   └── route.ts       # X402 protected endpoints
└── hooks/
    └── useNPCEconomy.ts               # React hook for NPC economy
```

### Environment Variables (Testnet)
```bash
# Plasma Testnet
NEXT_PUBLIC_PLASMA_TESTNET_CHAIN_ID=9746
NEXT_PUBLIC_PLASMA_TESTNET_RPC=https://testnet-rpc.plasma.to
NEXT_PUBLIC_USDT0_TESTNET_ADDRESS=<testnet-usdt0-address>

# NPC Economy
NPC_WALLET_SEED=<hd-wallet-seed>
CITY_TREASURY_ADDRESS=<treasury-address>
CITY_TREASURY_PRIVATE_KEY=<treasury-key>

# X402
X402_FACILITATOR_URL=https://x402.org/facilitator
```

### Database Schema (Optional - for persistence)
```sql
-- NPC Wallets (if using database instead of HD derivation)
CREATE TABLE npc_wallets (
  npc_id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  balance_cached BIGINT DEFAULT 0,
  last_synced TIMESTAMP
);

-- NPC Transactions
CREATE TABLE npc_transactions (
  id SERIAL PRIMARY KEY,
  from_npc_id TEXT NOT NULL,
  to_npc_id TEXT NOT NULL,
  amount BIGINT NOT NULL,
  tx_hash TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

1. **Private Key Storage**
   - Never expose NPC private keys to client
   - Encrypt at rest using AES-256
   - Use environment variables for master seed

2. **Rate Limiting**
   - Limit NPC transaction frequency
   - Max daily transaction volume per NPC
   - Prevent spam attacks

3. **Balance Validation**
   - Always check balance before sending
   - Handle insufficient funds gracefully
   - Fallback to simulated economy if chain unavailable

4. **Testnet Only (Initially)**
   - All development on testnet first
   - No real funds until thorough testing
   - Clear testnet indicators in UI

## Success Metrics

1. **Functional**
   - [ ] NPCs can send/receive USDT₮ on Plasma testnet
   - [ ] X402 payment flow works for NPC services
   - [ ] Daily economy cycle executes without errors

2. **Performance**
   - [ ] Transaction confirmation < 5 seconds
   - [ ] Balance sync < 1 second (cached)
   - [ ] 100+ NPCs can transact per game day

3. **UX**
   - [ ] NPC balances visible in UI
   - [ ] Transaction history accessible
   - [ ] Clear indication of real vs simulated

## Resources

- [X402 Documentation](https://www.x402.org/)
- [X402 SDK (GitHub)](https://github.com/coinbase/x402)
- [Plasma Testnet Docs](https://docs.plasma.to/guides/network-configuration/testnet-details)
- [EIP-3009 (gasless transfers)](https://eips.ethereum.org/EIPS/eip-3009)

---

*"The economy, it turns out, is just a very large group chat with money attached."*
