import PoolManagerABI from './abis/PoolManager.json';
import LiquidityVaultABI from './abis/LiquidityVault.json';
import CreditVaultABI from './abis/CreditVault.json';
import LoanEngineABI from './abis/LoanEngine.json';
import InsurancePoolABI from './abis/InsurancePool.json';
import MerchantRouterABI from './abis/MerchantRouter.json';
import MockERC20ABI from './abis/MockERC20.json';

export const CONTRACTS = {
    MASTER: {
        POOL_MANAGER: "0xB159E0c8093081712c92e274DbFEa5A97A80cA30",
        CREDIT_VAULT: "0x214730188780a3A64fD24ede85f2724535772Ff0",
        LOAN_ENGINE: "0x38E9cDB0eBc128bEA55c36C03D5532697669132d",
        MERCHANT_ROUTER: "0xEaa46cBBcAA628f923b3AEF76E560b3ba7E82747",
        INSURANCE_POOL: "0x386fd4Fa2F27E528CF2D11C6d4b0A4dceD283E0E"
    },
    SOURCE: {
        LIQUIDITY_VAULT: "0x054678B3dd544332F1918D989eBa80d270eA55a2",
        USDC: "0xfC06c48C7670a9E19D39Fe1a6D94e6B236fa983f",
        USDT: "0xF80ED662d06e7584DFAC6B010fF1145F4F0af14c"
    }
};

export const ABIS = {
    PoolManager: PoolManagerABI,
    LiquidityVault: LiquidityVaultABI,
    CreditVault: CreditVaultABI,
    LoanEngine: LoanEngineABI,
    InsurancePool: InsurancePoolABI,
    MerchantRouter: MerchantRouterABI,
    MockERC20: MockERC20ABI
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
