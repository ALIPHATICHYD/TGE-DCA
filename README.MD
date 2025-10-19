# TGE DCA Vault 

## 📋 Project Overview

**TGE DCA Vault** is a non-custodial Dollar-Cost Averaging (DCA) platform built on the Sui blockchain. It allows users to automate their cryptocurrency investments while maintaining full control of their funds through personal smart contract vaults.

### The Problem We Solve

Traditional DCA strategies on centralized exchanges (CEX) require users to:
- Deposit funds to the exchange (custodial risk)
- Trust the exchange not to freeze funds or get hacked
- Pay high fees for automated trading services
- Give up control of their private keys

### Our Solution

**Web3 Non-Custodial DCA Vault:**
- Users deposit stablecoins (USDC) into **their own** personal vault smart contract
- Users set their DCA rules (e.g., "buy 50 SUI every 7 days")
- Funds remain 100% in user control
- Logic is transparent and verifiable on-chain
- No intermediaries or trusted third parties

### How It Benefits the Community

1. **Financial Sovereignty**: Users maintain complete custody of their assets
2. **Transparency**: All trading logic is visible and auditable on the blockchain
3. **Accessibility**: zkLogin integration allows Web2 users to participate without crypto wallets
4. **Cost Efficiency**: Sponsored transactions reduce barriers to entry
5. **Risk Mitigation**: Eliminates centralized exchange counterparty risk
6. **DeFi Integration**: Direct integration with DeepBook for optimal execution
7. **Flexible Automation**: Users can customize their investment strategies

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│                 (Next.js + TypeScript)                      │
│  - Wallet Connection (@mysten/dapp-kit)                    │
│  - Vault Management Dashboard                              │
│  - Transaction Execution                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  | 
                  │                       
┌─────────────────▼─────────┐  
│   SUI BLOCKCHAIN          │  
│                           │ 
│  ┌────────────────────┐   │  
│  │  DCA Vault         │   │  
│  │  Smart Contract    │   │  
│  │                    │   │  
│  │  - Create vault    │   │  
│  │  - Execute DCA     │   │
│  │  - Manage funds    │   │
│  └────────┬───────────┘   │
│           │               │
│  ┌────────▼───────────┐   │
│  │  DeepBook          │   │
│  │  Integration       │   │
│  │                    │   │
│  │  - Swap USDC→SUI   │   │
│  │  - Limit orders    │   │
│  └────────────────────┘   │
└───────────────────────────┘
```

### Technology Stack

**Smart Contracts (Move):**
- Sui Move language for secure smart contract development
- Sui Framework dependencies
- DeepBook integration for DEX trading
- Shared Clock object for time-based execution

**Frontend (Next.js + TypeScript):**
- Next.js 14 with App Router
- TypeScript for type safety
- @mysten/dapp-kit for wallet integration
- @mysten/sui.js for blockchain interaction
- TailwindCSS for styling
- React hooks for state management

---

## 📁 Project Structure

```
tge-dca/
│
├── README.md                          # This file
│
├── move/                         # Move smart contracts
│   ├── Move.toml                     # Move package manifest
│   ├── sources/
│   │   ├── tge_dca.move           # Main DCA vault contract
│   │   └── deepbook_integration.move # DeepBook swap module
│   └── tests/
│       ├── tge_dca_tests.move     # Vault unit tests
│       └── deepbook_tests.move      # DeepBook integration tests
│
├── app/                          # Next.js frontend application
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── .env.local
│   │
│   ├── src/
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── layout.tsx           # Root layout with providers
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Main dashboard
│   │   │   └── how-it-works/
│   │   │       └── page.tsx        # Educational page
│   │   │
│   │   ├── components/               # React components
│   │   │   ├── WalletConnection.tsx
│   │   │   ├── CreateVault.tsx
│   │   │   ├── VaultList.tsx
│   │   │   ├── VaultCard.tsx
│   │   │   ├── ExecuteDCA.tsx
│   │   │   ├── VaultDetails.tsx
│   │   │   └── Navbar.tsx
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useVaults.ts
│   │   │   ├── useExecuteDCA.ts
│   │   │   ├── useCreateVault.ts
│   │   │   └── useDeepBook.ts
│   │   │
│   │   ├── lib/                      # Utility libraries
│   │   │   ├── sui-client.ts        # Sui client setup
│   │   │   ├── constants.ts         # Contract addresses, etc.
│   │   │   └── utils.ts             # Helper functions
│   │   │
│   │   └── types/                    # TypeScript type definitions
│   │       ├── vault.ts
│   │       ├── transaction.ts
│   │       └── index.ts
│   │
│   └── public/
│       ├── logo.svg
│       └── icons/
│
│
└── README.md
```

---
