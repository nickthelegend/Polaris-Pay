# Polaris Protocol Architecture (Real Cross-Chain)

## Overview
Polaris utilizes the **Creditcoin (USC) Decentralized Oracle** to trustlessly bridge liquidity and data from Source Chains (Sepolia) to the Master Hub (USC Testnet).

This architecture replaces the "Mock Oracle" with the actual `CCNext` bridge flow.

## Core Components

### 1. Source Chain (Sepolia)
*   **Contract**: `LiquidityVault.sol`
*   **Role**: Custody of assets.
*   **Action**: `deposit(token, amount)`
    *   Transfers USDC/USDT from User -> Vault.
    *   Emits `LiquidityDeposited(user, token, amount, nonce)`.
*   **Key Difference**: This event is the "Source of Truth" for the Oracle.

### 2. The Bridge (Relayer Layer)
*   **Tool**: `Offchain Worker` or `Manual Scripts` (based on CCNext examples).
*   **Step A (Submit)**: `submit_query(txHash)`
    *   Takes the Hash of the `deposit` transaction on Sepolia.
    *   Submits it to the Creditcoin Oracle.
*   **Step B (Proving)**: The Oracle verifies the transaction on Sepolia (confirms block depth/finality).
    *   Returns a unique `queryId`.

### 3. Master Hub (USC Testnet)
*   **Contract**: `PoolManager.sol` (inherits/uses Oracle logic)
*   **Role**: Global State & Logic.
*   **Action**: `addLiquidityFromProof(queryId)`
    *   Calls `oracle.getQueryResult(queryId)`.
    *   **Trustless Verification**: The contracts *does not trust the user*. It trusts the Oracle's data associated with `queryId`.
    *   Decodes the data: `(lender, token, amount, depositId)`.
    *   Updates Global LP Balances.

## Implementation Details

### Contract Interfaces
**`LiquidityVault.sol` (Sepolia)**:
```solidity
event LiquidityDeposited(address indexed lender, address indexed token, uint256 amount, uint256 depositId);
```

**`PoolManager.sol` (USC)**:
```solidity
function addLiquidityFromProof(bytes32 queryId) external {
    bytes memory data = oracle.getQueryResult(queryId);
    (address lender, address token, uint256 amount, uint256 id) = abi.decode(data, ...);
    // Logic to credit user
}
```

## Workflow
1.  **User**: Deposits 1000 USDC on Sepolia (`LiquidityVault`).
2.  **Relayer**: Detects event -> Calls `submit_query` to Creditcoin Oracle.
3.  **Oracle**: Waits for finality (~15 mins) -> Publishes Proof.
4.  **Relayer/User**: Calls `addLiquidityFromProof(queryId)` on USC.
5.  **PoolManager**: Updates User's Borrowing Power / LP Position.
