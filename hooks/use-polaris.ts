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

    return {
        loading,
        txHash,
        depositLiquidity,
        addLiquidityFromProof,
        getPoolLiquidity,
        getTokenBalance,
        getLPBalance,
        getLocalVaultStats,
        authenticated,
        address: wallet?.address,
        chainId: wallet?.chainId
    };
}
