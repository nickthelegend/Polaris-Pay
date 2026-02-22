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
import CreditOracleABI from './abis/CreditOracle.json';

export const CONTRACTS = {
    MASTER: {
        POOL_MANAGER: "0x9f40bfe80fADa11569c68d2DFb9f3250841C572E",
        LOAN_ENGINE: "0x3b3af0440510Cd99336AF525200Fd1d3F311DA24",
        SCORE_MANAGER: "0x4f8295bf1bE96b548aa0384673415217c4afed99",
        PROTOCOL_FUNDS: "0x45fDec5099580F2FeBa9E9e27FCd19BfEDDF4fA9", // Fallback to verified local
        MERCHANT_ROUTER: "0xCC5B2C15D50dBE201279533a1E3fDd643F8772bb", // Fallback
        CREDIT_ORACLE: "0x9260fD34Be71Fa6C8DFd7a989a0b64545FF5C0E9", // Fallback to Ganache (Code exists)
        USDC: "0x58e67DeeeCDE20f10ed90b5191f08f39e81b6658",
        ORACLE: "0x0000000000000000000000000000000000000FD2"
    },
    SPOKES: {
        SEPOLIA: {
            LIQUIDITY_VAULT: "0x5163A9689C0560DE07Cdc2ecA391BA5BE8b3D35A",
            USDC: "0xA715e84556b03aBdaC42aa421b5D6081A5434a2F",
            USDT: "0x87A0E38fF8e63AE90ea95bbd61Ce9c6EC75422d0",
            AVAX: "0x5b731C3e54b7aC7A5516861eac9704aDBC480584",
            WBTC: "0x4105F990aBd92f8CCCD8c58433963B862C4b34a5",
            WETH: "0x35504AceAea50B3dbeF640618b535feDB2db680B",
            LINK: "0x1929264FC968770A72021fE29aD5d9e4344ef152",
            BNB: "0xd376252519348D8d219C250E374CE81A1B528BE5",
            id: 11155111
        },
        HEDERA: {
            LIQUIDITY_VAULT: "0x214730188780a3A64fD24ede85f2724535772Ff0",
            USDC: "0x84373D817230268b2dE1d7727ca3c930293CCE51",
            USDT: "0xB159E0c8093081712c92e274DbFEa5A97A80cA30",
            id: 296
        },
        GANACHE: {
            LIQUIDITY_VAULT: "0xc4a748342b13F900c3691125A3D8019d36803c07",
            USDC: "0x294C0Ad33d01C27B9Aaf6d954Bb211416A06EB03",
            USDT: "0x4248759651CBBfBE5331325730b92d791C1bB8a1",
            POOL_MANAGER: "0xa196C48B229a026a6F55d2ece742276092F4Bc32",
            CREDIT_ORACLE: "0x9260fD34Be71Fa6C8DFd7a989a0b64545FF5C0E9",
            SCORE_MANAGER: "0xC1b3409Fb0c93Fed4A6cE046557cBE042d5A40Dc",
            LOAN_ENGINE: "0xe9f47f5f0D1A5bd5BfeCf46c48E72206fD7E4e82",
            MERCHANT_ROUTER: "0xCC5B2C15D50dBE201279533a1E3fDd643F8772bb",
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
    ProtocolFunds: ProtocolFundsABI,
    CreditOracle: CreditOracleABI
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
