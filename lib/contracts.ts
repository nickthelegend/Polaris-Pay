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
        POOL_MANAGER: "0x369B65aaD1c39159a0f860012f59D0F4c3484812",
        LOAN_ENGINE: "0xbCFCF4D1B880Ea38b71E45394FaCC5b71678C44A",
        MERCHANT_ROUTER: "0xf75C8eE5b4a005120bCF0D6d457A8000dddDea8f",
        ORACLE: "0xc43402c66e88f38a5aa6e35113b310e1c19571d4",
        SCORE_MANAGER: "0x5A1D3939C5b3a43B36Dc42C816bc5c0F02c1C261"
    },
    SPOKES: {
        SEPOLIA: {
            LIQUIDITY_VAULT: "0x7F7FfeC9a7a6DC8B383606BE86DE5bE9e99a1302",
            USDC: "0x02969F85a3B1f72c3317B494c41593d8F4B58907",
            USDT: "0x546Bbb8B960EaF059B0771cC4808Da13829e1c42",
            CTC: "0xD221D9E4F6E6709a3cf38cEC57662bbC7F60f3Df"
        },
        BASE_SEPOLIA: {
            LIQUIDITY_VAULT: "0xEaa46cBBcAA628f923b3AEF76E560b3ba7E82747",
            USDC: "0xB159E0c8093081712c92e274DbFEa5A97A80cA30",
            USDT: "0x214730188780a3A64fD24ede85f2724535772Ff0",
            CTC: "0x38E9cDB0eBc128bEA55c36C03D5532697669132d"
        },
        GANACHE: {
            LIQUIDITY_VAULT: "0xE66545D2271438Df70f0798E7A7c8DA5870BcD17",
            USDC: "0x9eFDA0B182b47F92cEb448E443c6250b60b2E9cE",
            USDT: "0x2c79502882bD43748a0bEe4a72206e0A1f856ba0",
            CTC: "0x158389325C6e4B7c7bfC976d8ec8Df731F96b846"
        }
    },
    // Legacy support to prevent breaking hooks
    SOURCE: {
        LIQUIDITY_VAULT: "0x7F7FfeC9a7a6DC8B383606BE86DE5bE9e99a1302",
        USDC: "0x02969F85a3B1f72c3317B494c41593d8F4B58907",
        USDT: "0x546Bbb8B960EaF059B0771cC4808Da13829e1c42",
        CTC: "0xD221D9E4F6E6709a3cf38cEC57662bbC7F60f3Df"
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
        name: "USC Hub",
        rpc: "https://rpc.usc-testnet.creditcoin.network",
        explorer: "https://explorer.usc-testnet.creditcoin.network",
        icon: "ethereum"
    },
    SEPOLIA: {
        id: 11155111,
        name: "Eth Sepolia",
        rpc: "https://ethereum-sepolia-rpc.publicnode.com",
        explorer: "https://sepolia.etherscan.io",
        icon: "ethereum"
    },
    BASE_SEPOLIA: {
        id: 84532,
        name: "Base Sepolia",
        rpc: "https://sepolia.base.org",
        explorer: "https://sepolia.basescan.org",
        icon: "base"
    },
    GANACHE: {
        id: 1337,
        name: "Localnet",
        rpc: "http://127.0.0.1:7545",
        explorer: "",
        icon: "ethereum"
    }
};
