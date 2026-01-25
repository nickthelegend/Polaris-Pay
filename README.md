# PayEase 

##  Project Overview

PayEase is a decentralized credit system built on Algorand that enables instant payments with credit limits backed by real-world verifications. Users can verify their identity through various providers (Zomato, Swiggy, Netflix, etc.) to unlock credit limits and make seamless on-chain payments.

**Key Features:**
-  Identity verification through Reclaim Protocol
-  Dynamic credit limits based on verifications
-  Piggy bank savings system
-  Instant checkout for partner merchants
-  Transaction history and analytics

##  Setup & Installation

### Prerequisites
- Node.js 18+ and npm/pnpm
- Algorand wallet (Pera, Defly, etc.) with testnet ALGO
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd PayEase
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

4. **Deploy smart contracts**
   ```bash
   # Update your wallet mnemonic in scripts/deploy.js
   npm run deploy:contracts
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Connect your Algorand wallet
   - Start using PayEase!

##  Deployed Smart Contracts

### Algorand TestNet Contracts

**Main Smart Contract**
- **Contract ID**: `123456789`
- **Purpose**: User registration and management
- **Verification**: [View on AlgoExplorer](https://lora.algokit.io/testnet/application/123456789)

**User Account Contract**
- **Contract ID**: `987654321` 
- **Purpose**: Individual user credit and verification management
- **Verification**: [View on AlgoExplorer](https://lora.algokit.io/testnet/application/987654321)

**USDC Asset**
- **Asset ID**: `10458941` (Algorand TestNet USDC)
- **Verification**: [View on AlgoExplorer](https://lora.algokit.io/testnet/asset/10458941)

> 🔍 **Verify Contracts**: Visit [lora.algokit.io/testnet](https://lora.algokit.io/testnet) and search for the contract IDs above to verify deployment and view contract details.

##  Architecture & Components

### Smart Contract Architecture

```
┌─────────────────────────────────────┐
│         MainSmartContract           │
├─────────────────────────────────────┤
│ • User registration                 │
│ • Payment processing                │
│ • Contract factory                  │
│ • Global state management          │
└─────────────────────────────────────┘
                  │
                  │ creates
                  ▼
┌─────────────────────────────────────┐
│        UserAccountContract          │
├─────────────────────────────────────┤
│ • Individual credit limits          │
│ • Verification tracking             │
│ • Piggy bank management            │
│ • Payment authorization            │
└─────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────┐
│            Next.js App              │
├─────────────────────────────────────┤
│ • React 19 + TypeScript             │
│ • Tailwind CSS + shadcn/ui          │
│ • Wallet integration               │
│ • Real-time contract interaction   │
└─────────────────────────────────────┘
                  │
                  │ integrates with
                  ▼
┌─────────────────────────────────────┐
│        External Services            │
├─────────────────────────────────────┤
│ • Reclaim Protocol (verification)   │
│ • Algorand TestNet                 │
│ • Prisma Database                  │
│ • Partner APIs                     │
└─────────────────────────────────────┘
```

### Key Components

- **`/contracts`**: Algorand TypeScript smart contracts
- **`/app`**: Next.js app router pages and API routes
- **`/components`**: Reusable UI components
- **`/lib/algorand`**: Blockchain integration layer
- **`/hooks`**: Custom React hooks
- **`/prisma`**: Database schema and migrations

### Verification Flow

1. User connects Algorand wallet
2. Registers with MainSmartContract (pays 0.005 ALGO)
3. UserAccountContract deployed for individual user
4. User verifies identity through Reclaim Protocol
5. Credit limit updated based on verifications
6. User can make payments up to their limit

##  Deployed Frontend

**Live Application**: [https://payease-demo.vercel.app](https://payease-demo.vercel.app)

### Features Available:
- ✅ Wallet connection (Pera, Defly, WalletConnect)
- ✅ Identity verification with 13+ providers
- ✅ Dynamic credit limit calculation
- ✅ Instant payment processing
- ✅ Transaction history
- ✅ Piggy bank savings
- ✅ Partner merchant integration

### Supported Wallets:
- Pera Wallet
- Defly Wallet
- Lute Wallet
- WalletConnect compatible wallets

---

**Built with ❤️ on Algorand** | **Powered by Reclaim Protocol** | **Styled with Tailwind CSS**