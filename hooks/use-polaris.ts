import { useState, useCallback } from 'react';
import { JsonRpcProvider, BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { CONTRACTS, ABIS, NETWORKS } from '@/lib/contracts';

export function usePolaris() {
    const { authenticated } = usePrivy();
    const { wallets } = useWallets();
    const wallet = wallets[0];

    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    const getContract = useCallback(async (address: string, abi: any, networkId: number, useSigner = true) => {
        const net = Object.values(NETWORKS).find(n => n.id === networkId);
        if (!net) throw new Error("Network config not found");

        if (useSigner) {
            if (!wallet) throw new Error("Wallet not connected");
            const currentChainId = parseInt(wallet.chainId.split(':')[1]);
            if (currentChainId !== networkId) {
                await wallet.switchChain(networkId);
            }
            const provider = new BrowserProvider(await wallet.getEthereumProvider());
            const signer = await provider.getSigner();
            return new Contract(address, abi, signer);
        } else {
            const provider = new JsonRpcProvider(net.rpc);
            return new Contract(address, abi, provider);
        }
    }, [wallet]);

    const depositLiquidity = async (tokenAddress: string, amount: string) => {
        setLoading(true);
        try {
            const vault = await getContract(CONTRACTS.SOURCE.LIQUIDITY_VAULT, ABIS.LiquidityVault, NETWORKS.LOCAL.id);
            const token = await getContract(tokenAddress, ABIS.MockERC20, NETWORKS.LOCAL.id);
            const amountWei = parseUnits(amount, 18);

            const approveTx = await token.approve(CONTRACTS.SOURCE.LIQUIDITY_VAULT, amountWei);
            await approveTx.wait();

            const depositTx = await vault.deposit(tokenAddress, amountWei);
            const receipt = await depositTx.wait();

            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            console.error("Deposit failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const addLiquidityFromProof = async (queryId: string) => {
        setLoading(true);
        try {
            const poolManager = await getContract(CONTRACTS.MASTER.POOL_MANAGER, ABIS.PoolManager, NETWORKS.USC.id);
            const tx = await poolManager.addLiquidityFromProof(queryId);
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            console.error("Proof submission failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getPoolLiquidity = async (tokenAddress: string) => {
        try {
            const poolManager = await getContract(CONTRACTS.MASTER.POOL_MANAGER, ABIS.PoolManager, NETWORKS.USC.id, false);
            const liquidity = await poolManager.getPoolLiquidity(tokenAddress);
            return formatUnits(liquidity, 18);
        } catch (error) {
            console.error("Fetch liquidity failed:", error);
            return "0";
        }
    };

    const getTokenBalance = async (tokenAddress: string, networkId: number) => {
        try {
            if (!wallet?.address) return "0";
            const token = await getContract(tokenAddress, ABIS.MockERC20, networkId, false);
            const balance = await token.balanceOf(wallet.address);
            return formatUnits(balance, 18);
        } catch (error) {
            console.error("Fetch balance failed:", error);
            return "0";
        }
    };

    const getLPBalance = async (tokenAddress: string) => {
        try {
            if (!wallet?.address) return "0";
            const poolManager = await getContract(CONTRACTS.MASTER.POOL_MANAGER, ABIS.PoolManager, NETWORKS.USC.id, false);
            const balance = await poolManager.lpBalance(wallet.address, tokenAddress);
            return formatUnits(balance, 18);
        } catch (error) {
            console.error("Fetch LP balance failed:", error);
            return "0";
        }
    };

    const getLocalVaultStats = async (tokenAddress: string) => {
        try {
            const vault = await getContract(CONTRACTS.SOURCE.LIQUIDITY_VAULT, ABIS.LiquidityVault, NETWORKS.LOCAL.id, false);
            const filter = vault.filters.LiquidityDeposited(null, tokenAddress);
            const events = await vault.queryFilter(filter);

            let totalLiquidity = BigInt(0);
            let userLiquidity = BigInt(0);

            events.forEach((event: any) => {
                const { lender, amount } = event.args;
                totalLiquidity += amount;
                if (wallet?.address && lender.toLowerCase() === wallet.address.toLowerCase()) {
                    userLiquidity += amount;
                }
            });

            return {
                total: formatUnits(totalLiquidity, 18),
                user: formatUnits(userLiquidity, 18)
            };
        } catch (error) {
            console.error("Fetch local vault stats failed:", error);
            return { total: "0", user: "0" };
        }
    };

    const getInsuranceStats = async () => {
        try {
            const pool = await getContract(CONTRACTS.MASTER.INSURANCE_POOL, ABIS.InsurancePool, NETWORKS.USC.id, false);
            const total = await pool.totalStaked();
            let user = "0";
            if (wallet?.address) {
                const balance = await pool.stakedCTC(wallet.address);
                user = formatUnits(balance, 18);
            }
            return {
                total: formatUnits(total, 18),
                user: user
            };
        } catch (error) {
            console.error("Fetch insurance stats failed:", error);
            return { total: "0", user: "0" };
        }
    };

    const getScore = async () => {
        try {
            if (!wallet?.address) return "0";
            const scoreManager = await getContract(CONTRACTS.MASTER.SCORE_MANAGER, ABIS.ScoreManager, NETWORKS.USC.id, false);
            const score = await scoreManager.getScore(wallet.address);
            return score.toString();
        } catch (error) {
            console.error("Fetch score failed:", error);
            return "0";
        }
    };

    const getCreditLimit = async (tokenAddress: string) => {
        try {
            if (!wallet?.address) return "0";
            const scoreManager = await getContract(CONTRACTS.MASTER.SCORE_MANAGER, ABIS.ScoreManager, NETWORKS.USC.id, false);
            const limit = await scoreManager.getCreditLimit(wallet.address, tokenAddress);
            return formatUnits(limit, 18);
        } catch (error) {
            console.error("Fetch credit limit failed:", error);
            return "0";
        }
    };

    const createLoan = async (amount: string, tokenAddress: string) => {
        setLoading(true);
        try {
            const loanEngine = await getContract(CONTRACTS.MASTER.LOAN_ENGINE, ABIS.LoanEngine, NETWORKS.USC.id);
            const amountWei = parseUnits(amount, 18);

            // Explicit gas limit for localnet/testnet stability
            const tx = await loanEngine.createLoan(wallet?.address, amountWei, tokenAddress, { gasLimit: 5000000 });
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            console.error("Create loan failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const repayLoan = async (loanId: number, amount: string) => {
        setLoading(true);
        try {
            const loanEngine = await getContract(CONTRACTS.MASTER.LOAN_ENGINE, ABIS.LoanEngine, NETWORKS.USC.id);
            const amountWei = parseUnits(amount, 18);

            const tx = await loanEngine.repay(loanId, amountWei);
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            console.error("Repay loan failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getLoans = async () => {
        try {
            if (!wallet?.address) return [];
            const loanEngine = await getContract(CONTRACTS.MASTER.LOAN_ENGINE, ABIS.LoanEngine, NETWORKS.USC.id, false);
            const count = await loanEngine.loanCount();
            const loans = [];

            // Naive iteration for demo (in prod, use indexer or graph)
            for (let i = 0; i < count; i++) {
                const loan = await loanEngine.loans(i);
                if (loan.borrower.toLowerCase() === wallet.address.toLowerCase()) {
                    loans.push({
                        id: i,
                        principal: formatUnits(loan.principal, 18),
                        repaid: formatUnits(loan.repaid, 18),
                        startTime: Number(loan.startTime),
                        status: Number(loan.status), // 0=Active, 1=Repaid, 2=Defaulted
                        poolToken: loan.poolToken
                    });
                }
            }
            return loans;
        } catch (error) {
            console.error("Fetch loans failed:", error);
            return [];
        }
    };

    const requestWithdrawal = async (tokenAddress: string, amount: string) => {
        setLoading(true);
        try {
            const poolManager = await getContract(CONTRACTS.MASTER.POOL_MANAGER, ABIS.PoolManager, NETWORKS.USC.id);
            const amountWei = parseUnits(amount, 18);

            const tx = await poolManager.requestWithdrawal(tokenAddress, amountWei);
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            console.error("Withdrawal request failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        txHash,
        depositLiquidity,
        addLiquidityFromProof,
        getPoolLiquidity,
        getTokenBalance,
        getLPBalance,
        getLocalVaultStats,
        getInsuranceStats,
        getScore,
        getCreditLimit,
        createLoan,
        repayLoan,
        getLoans,
        requestWithdrawal,
        authenticated,
        address: wallet?.address,
        chainId: wallet?.chainId
    };
}
