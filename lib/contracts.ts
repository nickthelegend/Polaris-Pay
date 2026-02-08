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
        POOL_MANAGER: "0xB159E0c8093081712c92e274DbFEa5A97A80cA30",
        LOAN_ENGINE: "0x38E9cDB0eBc128bEA55c36C03D5532697669132d",
        SCORE_MANAGER: "0x214730188780a3A64fD24ede85f2724535772Ff0",
        ORACLE: "0x0000000000000000000000000000000000000FD2"
    },
    SPOKES: {
        SEPOLIA: {
            LIQUIDITY_VAULT: "0x8C213a3Db9187966Ebf8DfD0488A225044265AeF",
            USDC: "0xbCFCF4D1B880Ea38b71E45394FaCC5b71678C44A",
            USDT: "0xf75C8eE5b4a005120bCF0D6d457A8000dddDea8f",
            id: 11155111
        },
        HEDERA: {
            LIQUIDITY_VAULT: "0x214730188780a3A64fD24ede85f2724535772Ff0",
            USDC: "0x84373D817230268b2dE1d7727ca3c930293CCE51",
            USDT: "0xB159E0c8093081712c92e274DbFEa5A97A80cA30",
            id: 296
        },
        GANACHE: {
            LIQUIDITY_VAULT: "0xD65C8EE7bEc2A0d8b4De201D4dA8fE8618d2804c",
            USDC: "0x0630517f75661fB84e2AA461F4a49D087bD62D9D",
            USDT: "0xCA1a2faA0d3c9b3c46Ef7550270be343D1D0fc63",
            POOL_MANAGER: "0x318f9E71124B8792bFE72b5bB21F3bFD5B90AecD",
            LOAN_ENGINE: "0x0f52D2B6d931290392F98D83be7D7807FfFf3f60",
            SCORE_MANAGER: "0xe9eF0a76C7E6EE3dA1ccAF4648A8c74bA3D388ED",
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
        explorer: "https://testnet.creditcoin.org",
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
