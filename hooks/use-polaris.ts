import { useState, useCallback, useEffect } from 'react';
import { ethers, BrowserProvider, JsonRpcProvider, Contract, parseUnits, formatUnits } from 'ethers';
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
        const chainIdStr = wallet?.chainId?.toString() || '';
        const isLocal = chainIdStr.includes('1337') || chainIdStr === '0x539' || chainIdStr === '539';

        console.log(`[POLARIS_DEBUG] Chain: ${chainIdStr}, isLocal: ${isLocal}`);

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
                        console.log(`[POLARIS] Insufficient balance(${formatUnits(balance, decimals)}).Auto - minting...`);
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
                        throw new Error(`Insufficient Balance.You have ${formatUnits(balance, decimals)} ${await token.symbol()} `);
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
        chainKey: any;
        blockHeight: any;
        encodedTransaction: string;
        merkleRoot: string;
        siblings: any[];
        lowerEndpointDigest: string;
        continuityRoots: string[];
    }) => {
        setLoading(true);
        try {
            console.log(`[POLARIS] 🚀 FINALIZING_SYNC: Starting proof submission for block ${proof.blockHeight} on chain ${proof.chainKey} `);

            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);

            // 1. DYNAMIC GAS ESTIMATION (Based on official bridge-examples logic)
            // 21000 (base) + (continuityBlocks * 5000) + 20000 (overhead)
            const continuityBlocks = proof.continuityRoots?.length || 1;
            const calculatedGas = 100000 + (continuityBlocks * 10000) + 100000; // Playing it safer than the examples for the pool manager complex logic
            console.log(`[POLARIS] ⏳ Calculated Gas Limit: ${calculatedGas} for ${continuityBlocks} continuity blocks.`);

            // 2. PRE-FLIGHT VERIFICATION
            console.log("[POLARIS] 🔍 Running Pre-Flight staticCall verification...");
            try {
                await poolManager.addLiquidityFromProof.staticCall(
                    proof.chainKey,
                    proof.blockHeight,
                    proof.encodedTransaction,
                    proof.merkleRoot,
                    proof.siblings,
                    proof.lowerEndpointDigest,
                    proof.continuityRoots
                );
                console.log("[POLARIS] ✅ Pre-Flight Passed.");
            } catch (staticError: any) {
                const reason = staticError.reason || staticError.message || "";
                console.warn("[POLARIS] ⚠️ Pre-Flight Verification Failed:", reason);

                if (reason.includes("already processed") || reason.includes("replay")) {
                    console.info("[POLARIS] Sync already completed previously.");
                    setTxHash("ALREADY_SYNCED");
                    return { hash: "ALREADY_SYNCED", status: 1 };
                }

                if (reason.includes("Continuity proof") || reason.includes("checkpoint") || reason.includes("match attestation")) {
                    console.warn("[POLARIS] ⏳ Hub Oracle Delay: Continuity roots not yet pushing to state.");
                    throw new Error("HUB_NOT_SYNCED"); // Frontend will catch this and give nice message
                }

                if (reason.includes("Native verification failed")) {
                    throw new Error("VERIFICATION_FAILED: The specific cryptographic proof failed to verify against the current Hub state.");
                }

                throw new Error(`CONTRACT_REVERT: ${reason} `);
            }

            // 3. EXECUTE TRANSACTION
            console.log("[POLARIS] 💸 Sending proof submission to PoolManager...");
            const tx = await poolManager.addLiquidityFromProof(
                proof.chainKey,
                proof.blockHeight,
                proof.encodedTransaction,
                proof.merkleRoot,
                proof.siblings,
                proof.lowerEndpointDigest,
                proof.continuityRoots,
                { gasLimit: calculatedGas } // Using our calculated gas
            );

            console.log(`[POLARIS] 🛰️ Transaction Broadcasted: ${tx.hash} `);
            const receipt = await tx.wait();

            if (!receipt || receipt.status === 0) {
                throw new Error("TRANSACTION_FAILED: The transaction was mined but reverted.");
            }

            console.log(`[POLARIS] 🏁 Sync Successful! Hub Tx: ${receipt.hash} `);
            setTxHash(receipt.hash);
            return receipt;

        } catch (error: any) {
            console.error("[POLARIS] ❌ FinalizeSync Failed:", error);

            // Re-throw standardized errors for the UI to catch
            if (error.message === "HUB_NOT_SYNCED") {
                throw new Error("The Hub hasn't registered this block's continuity roots yet. Please wait 2-3 minutes for the Oracle and try again.");
            }
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
            const balance = await poolManager.getAssetBalance(wallet.address, tokenAddress);

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

    const getUserTotalCollateral = async () => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id, false);
            const total = await poolManager.getUserTotalCollateral(wallet.address);
            return formatUnits(total, 18);
        } catch (error) {
            console.error("Fetch total collateral failed:", error);
            return "0";
        }
    };

    const getTotalTVL = async () => {
        try {
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id, false);

            let totalUSD = 0;
            let i = 0;

            // Loop through all whitelisted tokens on the Hub
            while (i < 10) { // Safety limit for dev
                try {
                    const tokenAddr = await poolManager.whitelistedTokens(i);
                    if (!tokenAddr || tokenAddr === ethers.ZeroAddress) break;

                    const liquidity = await poolManager.getPoolLiquidity(tokenAddr);

                    // Specific decimals for each token to ensure accurate aggregation
                    const token = await getContract(tokenAddr, ABIS.MockERC20, id, false);
                    let decimals = 18;
                    try { decimals = Number(await token.decimals()); } catch (e) { }

                    const formatted = parseFloat(formatUnits(liquidity, decimals));
                    totalUSD += formatted;
                    i++;
                } catch (e) {
                    break;
                }
            }
            return totalUSD.toString();
        } catch (error) {
            console.error("Fetch total TVL failed:", error);
            return "0";
        }
    };

    const getVaultPhysicalBalance = async (tokenAddress: string, networkId: number) => {
        try {
            const config = getSpokeConfig(networkId);
            const token = await getContract(tokenAddress, ABIS.MockERC20, networkId, false);
            const balance = await token.balanceOf(config.LIQUIDITY_VAULT);

            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            return formatUnits(balance, decimals);
        } catch (error) {
            console.error("Fetch physical vault balance failed:", error);
            return "0";
        }
    };

    const getScore = async () => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();
            const scoreManager = await getContract(config.SCORE_MANAGER, ABIS.ScoreManager, id, false);
            const score = await scoreManager.getScore(wallet.address);
            const scoreNum = Number(score);

            // If the Hub returns 0, it usually means a new user.
            // In the Polaris system, the minimum baseline is 300.
            return scoreNum === 0 ? "300" : scoreNum.toString();
        } catch (error) {
            console.error("Fetch score failed:", error);
            return "300"; // Default to base score for demo
        }
    };

    const getCreditLimit = async () => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();

            // 1. Get raw limit from ScoreManager
            const scoreManager = await getContract(config.SCORE_MANAGER, ABIS.ScoreManager, id, false);
            const totalLimit = await scoreManager.getCreditLimit(wallet.address);

            // 2. Get active debt from LoanEngine
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id, false);
            const activeDebt = await loanEngine.userActiveDebt(wallet.address);

            // 3. Calculate Available Limit
            const available = totalLimit > activeDebt ? totalLimit - activeDebt : BigInt(0);

            const limitVal = parseFloat(formatUnits(available, 18));

            // FALLBACK Logic for demo: if available is 0 but it's first time, we check equity
            if (limitVal === 0 && activeDebt === BigInt(0)) {
                const equity = await getUserTotalCollateral();
                return (parseFloat(equity) * 0.3).toString(); // Base 30% LTV
            }

            return limitVal.toString();
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
                        interest: formatUnits(loan.interestAmount, 18),
                        totalDebt: formatUnits(loan.principal + loan.interestAmount, 18),
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

    const payWithCredit = async (merchantAddress: string, amount: string, tokenAddress: string) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const router = await getContract((config as any).MERCHANT_ROUTER, ABIS.MerchantRouter, id);

            const token = await getContract(tokenAddress, ABIS.MockERC20, id, false);
            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            const amountWei = parseUnits(amount, decimals);

            console.log(`[POLARIS] Paying merchant ${merchantAddress} via Hub...`);
            const tx = await router.payWithCredit(merchantAddress, tokenAddress, amountWei, { gasLimit: 1000000 });
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            console.error("Payment failed:", error);
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

    const getAPY = async () => {
        try {
            const { config, id } = getMasterConfig();
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id, false);
            const rate = await loanEngine.INTEREST_RATE_BPS();
            const fee = await loanEngine.PROTOCOL_FEE_BPS();

            // APY for lenders = (Total Interest * (1 - Fee%)) / Total Assets
            // Simplified: Rate * (1 - ProtocolFeeBps/10000)
            const baseRateNum = Number(rate) / 100; // e.g. 10.00
            const feeFactor = (10000 - Number(fee)) / 10000;
            return (baseRateNum * feeFactor).toFixed(2);
        } catch (e) {
            return "8.00"; // Fallback
        }
    };

    const updateCreditProfile = async (attestation: {
        collateral: string;
        debt: string;
        timestamp: number;
        signature: string;
    }) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const oracle = await getContract((config as any).CREDIT_ORACLE, ABIS.CreditOracle, id);

            console.log("[POLARIS] Updating Credit Profile on Hub...");
            const tx = await oracle.updateProfile(
                wallet?.address,
                attestation.collateral,
                attestation.debt,
                attestation.timestamp,
                attestation.signature
            );
            const receipt = await tx.wait();
            return receipt;
        } catch (error) {
            console.error("Profile update failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getExternalNetValue = async () => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();
            console.log(`[POLARIS] getExternalNetValue: ConfigID=${id}, Oracle=${(config as any).CREDIT_ORACLE}, User=${wallet.address}`);
            const oracle = await getContract((config as any).CREDIT_ORACLE, ABIS.CreditOracle, id, false);
            const value = await oracle.getExternalNetValue(wallet.address);
            return formatUnits(value, 18);
        } catch (error: any) {
            if (error.code === 'BAD_DATA') {
                console.warn("[POLARIS] getExternalNetValue: BAD_DATA returned. Contract empty or wrong network? Defaulting to 0.");
                return "0";
            }
            console.error("Fetch external net value failed:", error);
            return "0";
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
        getUserTotalCollateral,
        getTotalTVL,
        getVaultPhysicalBalance,
        getScore,
        getCreditLimit,
        createLoan,
        payWithCredit,
        repayLoan,
        getLoans,
        requestWithdrawal,
        mintTokens,
        getMasterConfig,
        getContract,
        authenticated,
        address: wallet?.address,
        chainId: wallet?.chainId,
        getAPY,
        updateCreditProfile,
        getExternalNetValue
    };
}
