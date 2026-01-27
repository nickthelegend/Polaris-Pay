import PoolManagerABI from './abis/PoolManager.json';
import LiquidityVaultABI from './abis/LiquidityVault.json';
import CreditVaultABI from './abis/CreditVault.json';
import LoanEngineABI from './abis/LoanEngine.json';
import InsurancePoolABI from './abis/InsurancePool.json';
import MerchantRouterABI from './abis/MerchantRouter.json';
import MockERC20ABI from './abis/MockERC20.json';

import MockOracleRelayerABI from './abis/MockOracleRelayer.json';
import ScoreManagerABI from './abis/ScoreManager.json';

export const CONTRACTS = {
    MASTER: {
        POOL_MANAGER: "0x4a0936eBF038F9Edc62a76dC83634ca3285C98fA",
        CREDIT_VAULT: "0x4050D0E76EE03485cFc295b312f7F2aDAd80DcD5",
        LOAN_ENGINE: "0xDC9aA7aaB4d7EE7df43c1fc6e53F891D9576d1e4",
        MERCHANT_ROUTER: "0xf3F826bEfA15C30239Cb498Bc581d95C84Fa9528",
        INSURANCE_POOL: "0x7C871bff1ac0BA354F09253Ff2A2Db83F85C7B78",
        ORACLE: "0xB5f20dB7e76e9F4D7126C6b60966080837EFba65", // Mock for Localnet
        SCORE_MANAGER: "0x618732697Bf1A0912167f08a22eFF1fF209A1a7D"
    },
    SOURCE: {
        LIQUIDITY_VAULT: "0x2c3F12134DCc06d780671542d8aDD2fCfB303204",
        USDC: "0xD48455da09E276679D5eC5dB4D58b92fb1278115",
        USDT: "0x0539101eCa3Cb7cd99c3Ced68866aae6c4585137",
        CTC: "0x4CCFF67cc309A71A24bA1914B3F26ACA0a948509"
    }
};

export const ABIS = {
    PoolManager: PoolManagerABI,
    LiquidityVault: LiquidityVaultABI,
    CreditVault: CreditVaultABI,
    LoanEngine: LoanEngineABI,
    InsurancePool: InsurancePoolABI,
    MerchantRouter: MerchantRouterABI,
    MockERC20: MockERC20ABI,
    MockOracleRelayer: MockOracleRelayerABI,
    ScoreManager: ScoreManagerABI
};

export const NETWORKS = {
    USC: {
        id: 102033,
        name: "Creditcoin USC Testnet",
        rpc: "https://rpc.usc-testnet.creditcoin.network",
        explorer: "https://explorer.usc-testnet.creditcoin.network"
    },
    LOCAL: {
        id: 1337,
        name: "Localnet (Ganache)",
        rpc: "http://127.0.0.1:7545",
        explorer: ""
    }
};
