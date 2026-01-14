# Plasma Wallet Integration Specification

## Overview

Integrate Plasma wallet functionality into Crypto City using Privy authentication and gasless USDT0 transfers. This enables players to:
1. Connect wallets (Privy embedded or external like MetaMask)
2. View their real USDT0 balance
3. Purchase in-game items/credits with real Plasma USDT0
4. Send/receive gasless payments

## Technology Stack

### From xUSDT/plasma-sdk:
- **@plasma-pay/core** - Constants, chain definitions, USDT0 address
- **@plasma-pay/privy-auth** - Privy provider, hooks (usePlasmaWallet, useUSDT0Balance, useGaslessTransfer)
- **@plasma-pay/gasless** - EIP-3009 signature building, gasless transfer utilities
- **@privy-io/react-auth** - Privy SDK for wallet management

### Key Constants:
```typescript
PLASMA_MAINNET_CHAIN_ID = 9745
PLASMA_MAINNET_RPC = 'https://rpc.plasma.to'
USDT0_ADDRESS = '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb'
USDT0_DECIMALS = 6
```

## Architecture

### 1. Environment Configuration

Add to `.env.local`:
```
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=cmk5utj4502e0js0cdsgfanao

# Plasma Chain Configuration
NEXT_PUBLIC_PLASMA_CHAIN_ID=9745
NEXT_PUBLIC_PLASMA_RPC=https://rpc.plasma.to
NEXT_PUBLIC_USDT0_ADDRESS=0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb

# Merchant wallet for receiving payments
NEXT_PUBLIC_MERCHANT_ADDRESS=0x03BD07c84B6D9682E238ec865B34bECFE045d09A

# Relayer for gasless transactions (server-side only)
RELAYER_PRIVATE_KEY=<relayer-private-key>
```

### 2. Package Installation

```bash
npm install @privy-io/react-auth viem
```

Note: We'll inline the necessary code from @plasma-pay packages rather than npm link to keep deployment simple.

### 3. Component Architecture

```
src/
├── components/
│   ├── wallet/
│   │   ├── PlasmaProvider.tsx       # Privy provider wrapper
│   │   ├── ConnectWalletButton.tsx  # Login/logout button
│   │   ├── WalletBalance.tsx        # USDT0 balance display
│   │   ├── WalletDropdown.tsx       # Wallet info dropdown
│   │   ├── PayWithPlasma.tsx        # Payment modal
│   │   └── TransactionHistory.tsx   # Recent transactions
│   └── ...
├── hooks/
│   ├── usePlasmaWallet.ts           # Wallet state hook
│   ├── useUSDT0Balance.ts           # Balance hook
│   └── useGaslessTransfer.ts        # Transfer signing hook
├── lib/
│   └── plasma/
│       ├── constants.ts             # Chain constants
│       ├── eip3009.ts               # EIP-3009 typed data builders
│       └── types.ts                 # TypeScript types
└── app/
    └── api/
        └── relay/
            └── route.ts             # Server-side relay endpoint
```

### 4. User Flows

#### Flow 1: Connect Wallet
1. User clicks "Connect Wallet" button
2. Privy modal appears with login options (email, Google, Apple, wallet)
3. User authenticates
4. Privy creates/connects embedded wallet on Plasma chain
5. UI updates to show connected state + balance

#### Flow 2: Purchase Credits
1. User selects item to purchase (e.g., "Buy 1000 Credits - $0.99")
2. App shows payment confirmation modal
3. User clicks "Pay with Plasma"
4. App builds EIP-3009 transferWithAuthorization typed data
5. User signs via Privy wallet popup
6. App sends signature to relay API
7. Relay submits transaction on-chain
8. Credits are credited to user's game account

#### Flow 3: View Balance
1. Wallet connected → hook auto-fetches USDT0 balance
2. Balance displayed in header/wallet dropdown
3. Refresh button available to update

### 5. In-Game Purchasable Items

| Item | Price (USDT0) | Description |
|------|--------------|-------------|
| Starter Pack | $0.99 | 1000 credits + 3 bonus buildings |
| City Expansion | $2.99 | Unlock larger grid (64x64) |
| Premium Buildings | $4.99 | Access to legendary crypto buildings |
| Ad-Free | $9.99 | Remove all ads forever |
| Season Pass | $14.99 | All seasonal content |

### 6. Technical Implementation Details

#### EIP-3009 transferWithAuthorization
```typescript
// Typed data structure for signing
const typedData = {
  domain: {
    name: 'USDT0',
    version: '1',
    chainId: 9745,
    verifyingContract: USDT0_ADDRESS,
  },
  types: {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  },
  primaryType: 'TransferWithAuthorization',
  message: {
    from: userAddress,
    to: merchantAddress,
    value: amountAtomic,
    validAfter: Math.floor(Date.now() / 1000) - 1,
    validBefore: Math.floor(Date.now() / 1000) + 600,
    nonce: randomBytes32(),
  },
};
```

#### Relay API Endpoint
```typescript
// POST /api/relay
export async function POST(request: Request) {
  const { typedData, signature, v, r, s } = await request.json();
  
  // Validate signature matches typed data
  // Submit transaction using relayer wallet
  // Return transaction hash
}
```

### 7. Security Considerations

1. **Server-side relay** - Private key never exposed to client
2. **Signature validation** - Verify EIP-712 signature before relay
3. **Rate limiting** - Prevent spam transactions
4. **Amount limits** - Max transaction size per user/day
5. **Nonce management** - Use random bytes32 nonces (EIP-3009 style)

### 8. UI/UX Requirements

1. **Non-intrusive** - Wallet features optional, game playable without
2. **Clear pricing** - Always show USD equivalent
3. **Loading states** - Clear feedback during transactions
4. **Error handling** - User-friendly error messages
5. **Mobile-friendly** - Works on mobile browsers with wallet connect

### 9. Testing Strategy

1. **Unit tests** - Hook logic, signature building
2. **Integration tests** - Privy provider mounting, balance fetching
3. **E2E tests** - Full payment flow (testnet)

## GitHub Issues to Create

1. **#89** - Add Privy provider and wallet connection
2. **#90** - Implement USDT0 balance display
3. **#91** - Create gasless transfer hook
4. **#92** - Build relay API endpoint
5. **#93** - Create payment modal component
6. **#94** - Add in-game store with purchasable items
7. **#95** - Implement transaction history
8. **#96** - Epic: Plasma Wallet Integration

## Dependencies

- Privy account with app ID configured
- Relayer wallet with ETH for gas (or use Plasma gasless API)
- Merchant wallet to receive payments

## Timeline Estimate

- Phase 1 (Provider + Connection): 2-3 hours
- Phase 2 (Balance Display): 1-2 hours
- Phase 3 (Payment Flow): 3-4 hours
- Phase 4 (Store UI): 2-3 hours
- Phase 5 (Testing): 2-3 hours

Total: ~12-15 hours
