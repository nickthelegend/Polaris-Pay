import PoolManagerABI from './abis/PoolManager.json';
import LiquidityVaultABI from './abis/LiquidityVault.json';
import CreditVaultABI from './abis/CreditVault.json';
import LoanEngineABI from './abis/LoanEngine.json';
import InsurancePoolABI from './abis/InsurancePool.json';
import MerchantRouterABI from './abis/MerchantRouter.json';
import PolarisMerchantEscrowABI from './abis/PolarisMerchantEscrow.json';
import MockERC20ABI from './abis/MockERC20.json';
import MockOracleRelayerABI from './abis/MockOracleRelayer.json';
import ScoreManagerABI from './abis/ScoreManager.json';
import ProtocolFundsABI from './abis/ProtocolFunds.json';

export const CONTRACTS = {
    MASTER: {
        POOL_MANAGER: "0xB7f5B6dc3978046c7cEA05EB529e500400290675",
        LOAN_ENGINE: "0x2a5653E5621A197600757C35abEC1c6C50Ea5344",
        SCORE_MANAGER: "0x6EfC88aFa5bA8c0f68EbCEd8410c3B1c54b87242",
        PROTOCOL_FUNDS: "0x91602066C09bdd9B42D1F5eBaC574664fbb27278",
        MERCHANT_ROUTER: "0x722878c5349e602E6f6A2A3869a5C9213bAe183F",
        USDC: "0x58e67dEEEcde20f10eD90B5191f08f39e81B6658",
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
            POOL_MANAGER: "0xB7f5B6dc3978046c7cEA05EB529e500400290675",
            LOAN_ENGINE: "0x2a5653E5621A197600757C35abEC1c6C50Ea5344",
            SCORE_MANAGER: "0x6EfC88aFa5bA8c0f68EbCEd8410c3B1c54b87242",
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
    PolarisMerchantEscrow: PolarisMerchantEscrowABI,
    MockERC20: MockERC20ABI,
    MockOracleRelayer: MockOracleRelayerABI,
    ScoreManager: ScoreManagerABI,
    ProtocolFunds: ProtocolFundsABI
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
