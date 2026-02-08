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

    const getSpokeConfig = (networkId: number) => {
        if (networkId === NETWORKS.SEPOLIA.id) return CONTRACTS.SPOKES.SEPOLIA;
        // if (networkId === NETWORKS.BASE_SEPOLIA.id) return CONTRACTS.SPOKES.BASE_SEPOLIA;
        if (networkId === NETWORKS.GANACHE.id) return CONTRACTS.SPOKES.GANACHE;
        // Check if we are on Hedera (296)
        if (networkId === NETWORKS.HEDERA?.id) return CONTRACTS.SPOKES.HEDERA;
        return CONTRACTS.SOURCE; // Fallback
    };

    const getMasterConfig = () => {
        const isLocal = wallet?.chainId?.toString().includes('1337');
        return isLocal
            ? { config: CONTRACTS.SPOKES.GANACHE, id: NETWORKS.GANACHE.id }
            : { config: CONTRACTS.MASTER, id: NETWORKS.USC.id };
    };

    const getContract = useCallback(async (address: string, abi: any, networkId: number, useSigner = true) => {
        // ... existing getContract logic ...
        const net = Object.values(NETWORKS).find(n => n.id === networkId);
        if (!net) throw new Error(`Network config not found for ID ${networkId}`);

        const actualAbi = abi.abi || abi;

        if (useSigner) {
            if (!wallet) throw new Error("Wallet not connected");

            const chainIdPart = wallet.chainId.includes(':') ? wallet.chainId.split(':')[1] : wallet.chainId;
            const currentChainId = parseInt(chainIdPart);

            if (currentChainId !== networkId) {
                // Only switch if we are NOT targeting the Master chain from a Spoke 
                // actually, for Master interactions like AddLiquidity, we MUST be on Master.
                console.log(`[POLARIS] Switching from ${currentChainId} to ${networkId}...`);
                await wallet.switchChain(networkId);
            }
            const provider = new BrowserProvider(await wallet.getEthereumProvider());
            const signer = await provider.getSigner();
            return new Contract(address, actualAbi, signer);
        } else {
            // For read-only, use the RPC defined in NETWORKS
            const provider = new JsonRpcProvider(net.rpc);
            return new Contract(address, actualAbi, provider);
        }
    }, [wallet]);

    const depositLiquidity = async (tokenAddress: string, amount: string, networkId: number) => {
        setLoading(true);
        try {
            const config = getSpokeConfig(networkId);
            const vault = await getContract(config.LIQUIDITY_VAULT, ABIS.LiquidityVault, networkId);
            const token = await getContract(tokenAddress, ABIS.MockERC20, networkId);

            let decimals = 18;
            try {
                const d = await token.decimals();
                decimals = Number(d);
            } catch (e) {
                console.warn("Could not fetch decimals, defaulting to 18");
            }

            const amountWei = parseUnits(amount, decimals);

            // Check Balance & Auto-Mint on Testnet
            if (wallet?.address) {
                const balance = await token.balanceOf(wallet.address);
                if (balance < amountWei) {
                    const isTestnet = networkId === NETWORKS.SEPOLIA.id || networkId === NETWORKS.GANACHE.id;
                    if (isTestnet) {
                        console.log(`[POLARIS] Insufficient balance (${formatUnits(balance, decimals)}). Auto-minting...`);
                        try {
                            // Mint enough for this tx + buffer
                            const mintAmount = amountWei * BigInt(10);
                            const mintTx = await token.mint(wallet.address, mintAmount);
                            await mintTx.wait();
                            console.log("[POLARIS] Auto-mint successful.");
                        } catch (mintErr) {
                            console.error("Auto-mint failed", mintErr);
                            throw new Error("Insufficient balance and faucet failed.");
                        }
                    } else {
                        throw new Error(`Insufficient Balance. You have ${formatUnits(balance, decimals)} ${await token.symbol()}`);
                    }
                }
            }

            console.log(`[POLARIS] Approving token on chain ${networkId}...`);
            const approveTx = await token.approve(config.LIQUIDITY_VAULT, amountWei);
            await approveTx.wait();

            console.log(`[POLARIS] Depositing into vault on chain ${networkId}...`);
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

    const addLiquidityFromProof = async (proof: {
        chainKey: string | number;
        blockHeight: string | number;
        encodedTransaction: string;
        merkleRoot: string;
        siblings: { hash: string; isLeft: boolean }[];
        lowerEndpointDigest: string;
        continuityRoots: string[];
    }) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
            const tx = await poolManager.addLiquidityFromProof(
                proof.chainKey,
                proof.blockHeight,
                proof.encodedTransaction,
                proof.merkleRoot,
                proof.siblings,
                proof.lowerEndpointDigest,
                proof.continuityRoots
            );
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
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id, false);
            const liquidity = await poolManager.getPoolLiquidity(tokenAddress);

            // Get decimals
            const token = await getContract(tokenAddress, ABIS.MockERC20, id, false);
            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            return formatUnits(liquidity, decimals);
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

            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            return formatUnits(balance, decimals);
        } catch (error) {
            console.error("Fetch balance failed:", error);
            return "0";
        }
    };

    const getLPBalance = async (tokenAddress: string) => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id, false);
            const balance = await poolManager.lpBalance(wallet.address, tokenAddress);

            // Get decimals
            const token = await getContract(tokenAddress, ABIS.MockERC20, id, false);
            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            return formatUnits(balance, decimals);
        } catch (error) {
            console.error("Fetch LP balance failed:", error);
            return "0";
        }
    };

    const getLocalVaultStats = async (tokenAddress: string, networkId: number) => {
        try {
            const config = getSpokeConfig(networkId);
            const vault = await getContract(config.LIQUIDITY_VAULT, ABIS.LiquidityVault, networkId, false);

            // Get decimals
            const token = await getContract(tokenAddress, ABIS.MockERC20, networkId, false);
            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            const filter = vault.filters.LiquidityDeposited(null, tokenAddress);

            // Limit block range to avoid RPC errors
            const net = Object.values(NETWORKS).find(n => n.id === networkId);
            if (!net) throw new Error("Network not found");
            const provider = new JsonRpcProvider(net.rpc);
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 10000);

            const events = await vault.queryFilter(filter, fromBlock, 'latest');

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
                total: formatUnits(totalLiquidity, decimals),
                user: formatUnits(userLiquidity, decimals)
            };
        } catch (error) {
            console.error("Fetch local vault stats failed:", error);
            return { total: "0", user: "0" };
        }
    };

    const getScore = async () => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();
            const scoreManager = await getContract(config.SCORE_MANAGER, ABIS.ScoreManager, id, false);
            const score = await scoreManager.getScore(wallet.address);
            return score.toString();
        } catch (error) {
            console.error("Fetch score failed:", error);
            return "0";
        }
    };

    const getCreditLimit = async () => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();
            const scoreManager = await getContract(config.SCORE_MANAGER, ABIS.ScoreManager, id, false);
            const limit = await scoreManager.getCreditLimit(wallet.address);
            return formatUnits(limit, 18);
        } catch (error) {
            console.error("Fetch credit limit failed:", error);
            return "0";
        }
    };

    const createLoan = async (amount: string, tokenAddress: string) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);

            // Get decimals of the POOL token we are borrowing? 
            // Logic: createLoan(user, amount, poolToken)
            // Amount is in poolToken decimals.
            const token = await getContract(tokenAddress, ABIS.MockERC20, id, false);
            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            const amountWei = parseUnits(amount, decimals);

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
            const { config, id } = getMasterConfig();
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);

            // Need to know WHO we are repaying to know decimals.
            // But we only have ID. 
            // We fetch the loan first.
            const loan = await loanEngine.loans(loanId);
            const tokenAddress = loan.poolToken;

            const token = await getContract(tokenAddress, ABIS.MockERC20, id, false);
            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            const amountWei = parseUnits(amount, decimals);

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
            const { config, id } = getMasterConfig();
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id, false);
            const count = await loanEngine.loanCount();
            const loans = [];

            for (let i = 0; i < count; i++) {
                const loan = await loanEngine.loans(i);
                if (loan.borrower.toLowerCase() === wallet.address.toLowerCase()) {
                    loans.push({
                        id: i,
                        principal: formatUnits(loan.principal, 18),
                        repaid: formatUnits(loan.repaid, 18),
                        startTime: Number(loan.startTime),
                        status: Number(loan.status),
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

    const requestWithdrawal = async (tokenAddress: string, amount: string, destChainId: number) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
            const amountWei = parseUnits(amount, 18);

            const tx = await poolManager.requestWithdrawal(tokenAddress, amountWei, destChainId);
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

    const mintTokens = async (tokenAddress: string, amount: string, networkId: number) => {
        setLoading(true);
        try {
            const token = await getContract(tokenAddress, ABIS.MockERC20, networkId);

            let decimals = 18;
            try {
                const d = await token.decimals();
                decimals = Number(d);
            } catch (e) {
                console.warn("Could not fetch decimals, defaulting to 18");
            }

            const amountWei = parseUnits(amount, decimals);

            console.log(`[POLARIS] Minting tokens on chain ${networkId}...`);
            const tx = await token.mint(wallet?.address, amountWei);
            const receipt = await tx.wait();
            return receipt;
        } catch (error) {
            console.error("Mint failed:", error);
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
        getScore,
        getCreditLimit,
        createLoan,
        repayLoan,
        getLoans,
        requestWithdrawal,
        mintTokens,
        authenticated,
        address: wallet?.address,
        chainId: wallet?.chainId
    };
}
