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
        POOL_MANAGER: "0xe799b8f0A37786aa77b7540E5123E4FC103a3661",
        LOAN_ENGINE: "0x47F90ca038a1fdAA370eD8C8221F874270F4b54E",
        SCORE_MANAGER: "0x224c0D64c04c0DBEb1aA6D8103f06a7911a89cd9",
        ORACLE: "0x0000000000000000000000000000000000000FD2"
    },
    SPOKES: {
        SEPOLIA: {
            LIQUIDITY_VAULT: "0x5163A9689C0560DE07Cdc2ecA391BA5BE8b3D35A",
            USDC: "0xA715e84556b03aBdaC42aa421b5D6081A5434a2F",
            USDT: "0x87A0E38fF8e63AE90ea95bbd61Ce9c6EC75422d0",
            id: 11155111
        },
        HEDERA: {
            LIQUIDITY_VAULT: "0x214730188780a3A64fD24ede85f2724535772Ff0",
            USDC: "0x84373D817230268b2dE1d7727ca3c930293CCE51",
            USDT: "0xB159E0c8093081712c92e274DbFEa5A97A80cA30",
            id: 296
        },
        GANACHE: {
            LIQUIDITY_VAULT: "0xEbE8383ADaEa1Eb2eCFE9AC75d3f5825B0b8a350",
            USDC: "0x36b9FcD3c618E94fF8101669117985142C0b5D75",
            USDT: "0x170FE0F404FD26B4269E6559d1C7C1712743B278",
            POOL_MANAGER: "0x2a2cc16e7fa8E84169cD1c3bA79b37F2d1577B5F",
            LOAN_ENGINE: "0xdBA667c63045cceF16fa97DA7512A46cB02AD8FA",
            SCORE_MANAGER: "0x856442b9DD170cFDE24eB1cdF5F68E1A97e8C5E9",
            id: 1337
        }
    },
    // Legacy support
    SOURCE: {
        LIQUIDITY_VAULT: "0x8C213a3Db9187966Ebf8DfD0488A225044265AeF",
        USDC: "0xbCFCF4D1B880Ea38b71E45394FaCC5b71678C44A",
        USDT: "0xf75C8eE5b4a005120bCF0D6d457A8000dddDea8f"
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
        id: 102036,
        name: "USC Hub V2",
        rpc: "https://rpc.usc-testnet2.creditcoin.network",
        explorer: "https://explorer.usc-testnet2.creditcoin.network",
        icon: "creditcoin"
    },
    SEPOLIA: {
        id: 11155111,
        name: "Eth Sepolia",
        rpc: "https://1rpc.io/sepolia",
        explorer: "https://sepolia.etherscan.io",
        icon: "ethereum"
    },
    HEDERA: {
        id: 296,
        name: "Hedera Testnet",
        rpc: "https://testnet.hashio.io/api",
        explorer: "https://hashscan.io/testnet",
        icon: "hedera"
    },
    GANACHE: {
        id: 1337,
        name: "Localnet",
        rpc: "http://127.0.0.1:7545",
        explorer: "",
        icon: "ethereum"
    }
};
