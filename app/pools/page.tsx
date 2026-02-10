"use client"

import useSWR from "swr"
const fetcher = (url: string) => fetch(url).then((r) => r.json())

import { ConnectGate } from "@/components/connect-gate"
import {
    Plus,
    RotateCcw,
    Search,
    ArrowDown,
    Zap,
    Database,
    LayoutDashboard,
    Coins,
    ShieldCheck,
    Lock,
    RefreshCw,
    Wallet,
    ChevronDown,
    Info
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { usePolaris } from "@/hooks/use-polaris"
import { CONTRACTS, NETWORKS } from "@/lib/contracts"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { BridgeStatus } from "@/components/bridge-status"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

// Helper for chain icons
const getChainIcon = (chain: string) => {
    const icons: Record<string, string> = {
        ethereum: "https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg",
        base: "https://icons.llamao.fi/icons/chains/rsz_base.jpg",
        arbitrum: "https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg",
        polygon: "https://icons.llamao.fi/icons/chains/rsz_polygon.jpg",
    };
    return icons[chain.toLowerCase()] || icons.ethereum;
};

export default function PoolsPage() {
    const {
        address,
        depositLiquidity,
        addLiquidityFromProof,
        requestWithdrawal,
        getPoolLiquidity,
        getTokenBalance,
        getLPBalance,
        getUserTotalCollateral,
        getTotalTVL,
        getVaultPhysicalBalance,
        loading,
        authenticated,
        chainId,
        getScore,
        getCreditLimit,
        createLoan,
        repayLoan,
        getLoans,
        mintTokens
    } = usePolaris();

    // Liquidity & Balance State
    const [usdcLiquidity, setUsdcLiquidity] = useState("0");
    const [usdtLiquidity, setUsdtLiquidity] = useState("0");
    const [usdcPhysicalLiq, setUsdcPhysicalLiq] = useState("0");
    const [usdtPhysicalLiq, setUsdtPhysicalLiq] = useState("0");
    const [ctcLiquidity, setCtcLiquidity] = useState("0");
    const [usdcUserBalance, setUsdcUserBalance] = useState("0");
    const [usdtUserBalance, setUsdtUserBalance] = useState("0");
    const [usdcLPBalance, setUsdcLPBalance] = useState("0");
    const [usdtLPBalance, setUsdtLPBalance] = useState("0");
    const [totalEquity, setTotalEquity] = useState("0");
    const [totalTVL, setTotalTVL] = useState("0");
    const [ctcLPBalance, setCtcLPBalance] = useState("0");

    // Default to USC View, but allows selecting which SPOKE to view
    const [selectedView, setSelectedView] = useState<keyof typeof NETWORKS>("USC");

    // Credit & Loan State
    const [userScore, setUserScore] = useState("0");
    const [creditLimit, setCreditLimit] = useState("0");
    const [activeLoans, setActiveLoans] = useState<any[]>([]);

    // Modal State
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [depositTarget, setDepositTarget] = useState<{ token: string, symbol: string, chainKey: keyof typeof NETWORKS } | null>(null);
    const [depositAmount, setDepositAmount] = useState("100");

    const [isLoanOpen, setIsLoanOpen] = useState(false);
    const [loanAmount, setLoanAmount] = useState("50");

    // Bridge State
    const [isSyncOpen, setIsSyncOpen] = useState(false);
    const [syncProofData, setSyncProofData] = useState("");

    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("50");
    const [withdrawTarget, setWithdrawTarget] = useState<{ token: string, symbol: string } | null>(null);
    const [lastDepositTx, setLastDepositTx] = useState<string | null>(null);

    // Proof Viewer State
    const [isProofViewerOpen, setIsProofViewerOpen] = useState(false);
    const [generatedProof, setGeneratedProof] = useState<any>(null);

    const { data: poolsData } = useSWR("/api/pools", fetcher)
    const pools = poolsData?.pools ?? []

    const usdcPool = pools.find((p: any) => p.name === 'USDC_VAULT' || p.name === 'USDC')
    const usdtPool = pools.find((p: any) => p.name === 'USDT_VAULT' || p.name === 'USDT')

    useEffect(() => {
        if (authenticated) {
            refreshData();
        }
    }, [authenticated, selectedView]);

    const refreshData = async () => {
        try {
            console.log(`[POLARIS] Refreshing data for view: ${selectedView}...`);

            // 1. Fetch Aggregated Hub stats (Equity & TVL across ALL chains)
            const aggregatedEquity = await getUserTotalCollateral();
            setTotalEquity(aggregatedEquity);

            const aggregatedTVL = await getTotalTVL();
            setTotalTVL(aggregatedTVL);

            // 2. Score & Loans (Always Hub context)
            const score = await getScore();
            setUserScore(score);
            const limit = await getCreditLimit();
            setCreditLimit(limit);

            const loans = await getLoans();
            setActiveLoans(loans);

            // 3. Fetch specific asset liquidities on the HUB using the SOURCE TOKEN ADDRESSES
            // This ensures we are NOT scraping the spoke, but asking the Hub "how much USDC from Sepolia do we have?"
            const net = NETWORKS[selectedView];
            const spokeConfig = (CONTRACTS.SPOKES as any)[selectedView];

            // In USC view, we show Sepolia tokens as a default or sum? 
            // For now, let's make it smarter: Hub view shows aggregate, Spoke view shows spoke funds recorded on Hub
            if (selectedView === "USC") {
                // Sum of all whitelisted assets for TVL
                const usdcHubLiq = await getPoolLiquidity(CONTRACTS.SPOKES.SEPOLIA.USDC);
                const usdtHubLiq = await getPoolLiquidity(CONTRACTS.SPOKES.SEPOLIA.USDT);
                setUsdcLiquidity(usdcHubLiq);
                setUsdtLiquidity(usdtHubLiq);

                const usdcLP = await getLPBalance(CONTRACTS.SPOKES.SEPOLIA.USDC);
                const usdtLP = await getLPBalance(CONTRACTS.SPOKES.SEPOLIA.USDT);
                setUsdcLPBalance(usdcLP);
                setUsdtLPBalance(usdtLP);
            } else {
                // Hub's record of this specific spoke's tokens
                const usdcLiq = await getPoolLiquidity(spokeConfig.USDC);
                const usdtLiq = await getPoolLiquidity(spokeConfig.USDT);
                setUsdcLiquidity(usdcLiq);
                setUsdtLiquidity(usdtLiq);

                const usdcLP = await getLPBalance(spokeConfig.USDC);
                const usdtLP = await getLPBalance(spokeConfig.USDT);
                setUsdcLPBalance(usdcLP);
                setUsdtLPBalance(usdtLP);

                // 4. Fetch Physical Reserves (The actual tokens in the contract on the source chain)
                const physUsdc = await getVaultPhysicalBalance(spokeConfig.USDC, net.id);
                const physUsdt = await getVaultPhysicalBalance(spokeConfig.USDT, net.id);
                setUsdcPhysicalLiq(physUsdc);
                setUsdtPhysicalLiq(physUsdt);

                // Real user balance on the selected chain (for the deposit button)
                const ubUsdc = await getTokenBalance(spokeConfig.USDC, net.id);
                const ubUsdt = await getTokenBalance(spokeConfig.USDT, net.id);
                setUsdcUserBalance(ubUsdc);
                setUsdtUserBalance(ubUsdt);
            }

            if (selectedView === "USC") {
                setUsdcPhysicalLiq("0");
                setUsdtPhysicalLiq("0");
            }

            console.log(`[SCORE]: ${score}`);
        } catch (err) {
            console.error("Refresh failed:", err);
        }
    };

    const handleViewChange = (view: keyof typeof NETWORKS) => {
        setSelectedView(view);
        toast.info(`View switched to ${NETWORKS[view].name}`);
    };

    const openDepositModal = (token: string, symbol: string) => {
        if (selectedView === "USC") {
            toast.warn("Switch to a Spoke Chain (e.g. Sepolia) to deposit");
            return;
        }
        setDepositTarget({ token, symbol, chainKey: selectedView });
        setIsDepositOpen(true);
    };

    const executeDeposit = async () => {
        if (!depositTarget) return;
        try {
            toast.info(`Initiating ${depositAmount} ${depositTarget.symbol} deposit on ${NETWORKS[depositTarget.chainKey].name}...`);
            const receipt = await depositLiquidity(depositTarget.token, depositAmount, NETWORKS[depositTarget.chainKey].id);
            toast.success("Deposit successful! Auto-syncing credit limit...");

            setLastDepositTx(receipt.hash);
            setIsDepositOpen(false); // Close Modal immediately

            // 1. Push to Database (Fire & Forget)
            try {
                await fetch("/api/proof", {
                    method: "POST",
                    body: JSON.stringify({
                        txHash: receipt.hash,
                        chainKey: NETWORKS[depositTarget.chainKey].id,
                        userAddress: address,
                        amount: depositAmount,
                        tokenAddress: depositTarget.token
                    })
                });
                toast.success("Deposit recorded. Syncing in background...");
            } catch (e) {
                console.warn("Failed to push to DB", e);
            }

            // 2. Trigger Auto-Sync (Polling)
            autoSyncProof(receipt.hash, depositTarget.chainKey);

            refreshData();
        } catch (error) {
            console.error("Deposit error:", error);
            toast.error("Deposit failed. Check console.");
        }
    };

    const autoSyncProof = async (txHash: string, sourceChainKey: keyof typeof NETWORKS) => {
        try {
            // Polling Logic
            let attempts = 0;
            const maxAttempts = 240; // 20 minutes (Attestation can take 10-15 mins)
            let proof = null;

            toast.info("⏳ Syncing Protocol State... (You can browse freely)");

            while (attempts < maxAttempts) {
                try {
                    const chainKeyId = NETWORKS[sourceChainKey].id;
                    // This GET now hits our internal DB first
                    const response = await fetch(`/api/proof?txHash=${txHash}&chainKey=${chainKeyId}`);
                    const data = await response.json();

                    if (data.merkleRoot) {
                        // Proof Found!
                        const { ProofUtils } = await import("@/lib/proof-utils");
                        proof = ProofUtils.formatProof(data);
                        break;
                    }
                } catch (e) { }

                await new Promise(r => setTimeout(r, 5000)); // Poll every 5s
                attempts++;
            }

            if (!proof) throw new Error("Sync timed out. Please try Manual Sync.");

            // Open Proof Viewer
            setGeneratedProof(proof);
            setIsProofViewerOpen(true);
            toast.success("Proof Generated! Review in terminal.");

            // We don't auto-finalize now, we let the user review and click "Sync"
        } catch (error: any) {
            console.error("Auto-sync failed:", error);
            toast.warn("Sync requires manual approval.");
            setSyncProofData(txHash);
        }
    };

    const finalizeSync = async () => {
        if (!generatedProof) return;
        try {
            // Switch to Hub if needed
            if (Number(chainId) !== NETWORKS.USC.id) {
                toast.info("Please switch to Master Hub (USC) to finalize.");
                // return; // Let them switch and click again? Or wagmi switch?
                // For better UX, we just proceed and let the wallet prompt invoke switch if possible or fail.
            }

            toast.info("Submitting Proof to Master Chain...");
            const receipt = await addLiquidityFromProof(generatedProof);

            // Record the HUB hash so it shows up in explorer links
            try {
                await fetch("/api/proof", {
                    method: "POST",
                    body: JSON.stringify({
                        txHash: lastDepositTx, // The source tx
                        hubTxHash: receipt.hash,
                        status: 'Synced'
                    })
                });
            } catch (e) { console.warn("DB Update failed", e); }

            toast.success("✅ Protocol Synced!");
            setIsProofViewerOpen(false);
            setGeneratedProof(null);
            setSelectedView("USC");
            refreshData();
        } catch (e) {
            console.error(e);
            toast.error("Sync failed on chain.");
        }
    };


    const executeLoan = async () => {
        try {
            toast.info(`Requesting ${loanAmount} USDC Loan...`);
            // Loans are created against the Hub's primary collateral token reference
            await createLoan(loanAmount, CONTRACTS.SPOKES.SEPOLIA.USDC);
            toast.success("Loan Approved & Funded!");
            setIsLoanOpen(false);
            refreshData();
        } catch (error) {
            console.error("Loan failed:", error);
            toast.error("Loan request rejected.");
        }
    };

    const executeRepay = async (id: number, amount: string) => {
        try {
            toast.info(`Repaying Loan #${id}...`);
            await repayLoan(id, amount);
            toast.success("Repayment successful!");
            refreshData();
        } catch (error) {
            console.error("Repay failed:", error);
            toast.error("Repayment failed.");
        }
    };

    const executeSyncProof = async () => {
        try {
            toast.info("Submitting V2 proof to Hub...");
            const proof = JSON.parse(syncProofData);
            await addLiquidityFromProof(proof);
            toast.success("Liquidity Synced with V2 Native Verification!");
            setIsSyncOpen(false);
            setSyncProofData("");
            refreshData();
        } catch (error) {
            console.error("Sync failed:", error);
            toast.error("Sync failed. Ensure proof JSON is valid.");
        }
    };

    const openWithdrawModal = (token: string, symbol: string) => {
        if (selectedView !== "USC") {
            toast.warn("Switch to USC Hub to request withdrawals");
            return;
        }
        setWithdrawTarget({ token, symbol });
        setIsWithdrawOpen(true);
    };

    const executeWithdrawal = async () => {
        if (!withdrawTarget) return;
        try {
            toast.info(`Requesting withdrawal of ${withdrawAmount} ${withdrawTarget.symbol}...`);
            await requestWithdrawal(CONTRACTS.SPOKES.SEPOLIA.USDC, withdrawAmount, NETWORKS.SEPOLIA.id);
            toast.success("Withdrawal Authorized! Check monitor for status.");
            setIsWithdrawOpen(false);
            refreshData();
        } catch (error) {
            console.error("Withdrawal failed:", error);
            toast.error("Withdrawal failed.");
        }
    };

    const executeMint = async () => {
        if (!depositTarget) return;
        try {
            toast.info(`Minting 1000 ${depositTarget.symbol}...`);
            await mintTokens(depositTarget.token, "1000", NETWORKS[depositTarget.chainKey].id);
            toast.success("Tokens minted successfully!");
            refreshData();
        } catch (error) {
            console.error("Mint failed:", error);
            toast.error("Mint failed.");
        }
    };

    return (
        <ConnectGate>
            <div className="flex-1 flex flex-col py-8 gap-6 w-full font-mono text-white">
                <div className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">Aggregated_Credit_System // multi_chain_v2</span>
                    <h1 className="text-white text-xl tracking-tighter font-bold uppercase">Cross-Chain Liquidity Terminal</h1>
                </div>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl col-span-2">
                        <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center text-white">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest">Global_Status</span>
                            <span className="text-primary text-[10px] animate-pulse flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                CONNECTED: {selectedView}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 text-white">
                            <div className="p-6 flex flex-col gap-1">
                                <span className="text-[10px] text-white/40 tracking-wider uppercase">Aggregated_Value_Locked</span>
                                <div className="flex items-baseline gap-2 text-white">
                                    <span className="text-white text-3xl font-bold tracking-tighter">${Number(totalTVL).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col gap-1">
                                <span className="text-[10px] text-white/40 tracking-wider uppercase">Your_Equity</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-white text-3xl font-bold tracking-tighter">${Number(totalEquity).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col gap-1">
                                <span className="text-[10px] text-white/40 tracking-wider uppercase">Active_Debt</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-red-400 text-3xl font-bold tracking-tighter">{activeLoans.filter(l => l.status === 0).length}</span>
                                    <span className="text-white/40 text-[10px] uppercase">LOANS</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl flex flex-col">
                        <div className="bg-white/5 px-4 py-2 border-b border-white/10 text-white">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest">Global_Risk_Score</span>
                        </div>
                        <div className="p-6 flex flex-col gap-4 flex-1 justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <ShieldCheck className="w-24 h-24 text-primary" />
                            </div>
                            <div className="flex flex-col gap-1 z-10">
                                <span className="text-[10px] text-white/40 tracking-wider uppercase">Polaris_FICO</span>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-black tracking-tighter ${Number(userScore) > 700 ? 'text-primary' : Number(userScore) > 500 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {userScore}
                                    </span>
                                    <span className="text-white/40 text-[10px] font-bold">/ 850</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 z-10">
                                <span className="text-[10px] text-white/40 tracking-wider uppercase">Combined_Credit_Limit</span>
                                <span className="text-white text-xl font-bold tracking-tight">${Number(creditLimit).toLocaleString()} USDC</span>
                            </div>
                            <button
                                onClick={() => setIsLoanOpen(true)}
                                className="mt-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-all"
                            >
                                Get_Credit_Line
                            </button>

                            {/* Sync Warning */}
                            {(Number(usdcLPBalance) > 0 || Number(usdtLPBalance) > 0) && Number(creditLimit) === 0 && (
                                <div className="mt-2 bg-red-500/10 border border-red-500/20 p-2 rounded-sm flex items-center gap-2 animate-pulse cursor-pointer" onClick={() => setIsSyncOpen(true)}>
                                    <RefreshCw className="w-3 h-3 text-red-400" />
                                    <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">
                                        SYNC_REQUIRED_FOR_CREDIT_LIMIT
                                    </span>
                                </div>
                            )}
                        </div>
                        <BridgeStatus address={address} />
                    </div>
                </section>

                <div className="flex flex-col gap-6">
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <LayoutDashboard className="w-4 h-4 text-primary" />
                                <h2 className="text-white text-xs font-bold uppercase tracking-widest">Fleet_Operations</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-sm hover:bg-white/10 transition-all cursor-pointer min-w-[180px]">
                                            <span className={`w-1.5 h-1.5 rounded-full ${selectedView === 'USC' ? 'bg-primary' : 'bg-blue-400'}`} />
                                            <span className="text-[10px] text-white font-bold tracking-widest uppercase flex-1 text-left">
                                                {NETWORKS[selectedView].name}
                                            </span>
                                            <ChevronDown className="w-3 h-3 text-white/40" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 min-w-[200px]">
                                        {Object.entries(NETWORKS).map(([key, net]) => (
                                            <DropdownMenuItem
                                                key={key}
                                                onClick={() => handleViewChange(key as keyof typeof NETWORKS)}
                                                className="text-[10px] uppercase font-bold tracking-tighter cursor-pointer focus:bg-primary/20 flex items-center gap-2 py-3"
                                            >
                                                <div className={`size-1.5 rounded-full ${key === 'USC' ? 'bg-primary' : 'bg-blue-400'}`} />
                                                {net.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <button
                                    onClick={() => setIsSyncOpen(true)}
                                    className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-sm hover:bg-primary/20 transition-all text-[10px] text-primary uppercase tracking-widest"
                                >
                                    <Zap className="w-3 h-3" />
                                    SYNC_MANUAL
                                </button>

                                <button
                                    onClick={refreshData}
                                    className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-sm hover:bg-white/10 transition-all text-[10px] text-white/70 uppercase tracking-widest"
                                >
                                    <RefreshCw className={`w-3 h-3 text-primary ${loading ? "animate-spin" : ""}`} />
                                    REFRESH
                                </button>
                            </div>
                        </div>

                        <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col flex-1 min-h-[400px]">
                            <div className="grid grid-cols-12 bg-white/5 border-b border-white/10 px-6 py-4">
                                <div className="col-span-4">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Asset_Type</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Vault_Reserves</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Your_Deposit</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">APR</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Control</span>
                                </div>
                            </div>

                            <div className="overflow-y-auto">
                                {/* Pool Row: USDC */}
                                <div className="grid grid-cols-12 px-6 py-5 border-b border-white/5 hover:bg-white/[0.04] transition-all items-center">
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="size-10 bg-blue-500/10 rounded-sm flex items-center justify-center border border-blue-500/20">
                                            <Coins className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white text-sm font-bold uppercase">USDC_VAULT</span>
                                                <img src={getChainIcon(NETWORKS[selectedView as keyof typeof NETWORKS].icon)} className="size-3 opacity-50" alt="chain" />
                                            </div>
                                            <span className="text-[10px] text-white/30 uppercase">{NETWORKS[selectedView as keyof typeof NETWORKS].name}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-primary/80 text-sm tracking-tighter font-bold font-mono">${Number(usdcPhysicalLiq).toLocaleString()}</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white text-sm tracking-tighter font-medium font-mono">${Number(usdcLPBalance).toLocaleString()}</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-primary text-sm tracking-tighter font-bold">{usdcPool?.apr ?? 0}%</span>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-3">
                                        <button
                                            onClick={() => openDepositModal(selectedView === 'USC' ? CONTRACTS.SPOKES.SEPOLIA.USDC : (CONTRACTS.SPOKES as Record<string, any>)[selectedView].USDC, "USDC")}
                                            className="bg-primary/90 hover:bg-primary text-primary-foreground px-4 py-1.5 rounded-sm font-black text-[10px] uppercase cursor-pointer transition-all active:scale-95"
                                        >
                                            Deposit
                                        </button>
                                        <button
                                            onClick={() => openWithdrawModal(selectedView === 'USC' ? CONTRACTS.SPOKES.SEPOLIA.USDC : (CONTRACTS.SPOKES as Record<string, any>)[selectedView].USDC, "USDC")}
                                            className="border border-white/10 text-white/60 hover:text-white hover:bg-white/5 px-4 py-1.5 rounded-sm font-bold text-[10px] uppercase transition-all active:scale-95"
                                        >
                                            Withdraw
                                        </button>
                                    </div>
                                </div>

                                {/* Pool Row: USDT */}
                                <div className="grid grid-cols-12 px-6 py-5 border-b border-white/5 hover:bg-white/[0.04] transition-all items-center">
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="size-10 bg-green-500/10 rounded-sm flex items-center justify-center border border-green-500/20">
                                            <Coins className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white text-sm font-bold uppercase">USDT_VAULT</span>
                                                <img src={getChainIcon(NETWORKS[selectedView as keyof typeof NETWORKS].icon)} className="size-3 opacity-50" alt="chain" />
                                            </div>
                                            <span className="text-[10px] text-white/30 uppercase">{NETWORKS[selectedView as keyof typeof NETWORKS].name}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-primary/80 text-sm tracking-tighter font-bold font-mono">${Number(usdtPhysicalLiq).toLocaleString()}</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white text-sm tracking-tighter font-medium font-mono">${Number(usdtLPBalance).toLocaleString()}</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-primary text-sm tracking-tighter font-bold">{usdtPool?.apr ?? 0}%</span>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-3">
                                        <button
                                            onClick={() => openDepositModal(selectedView === 'USC' ? CONTRACTS.SPOKES.SEPOLIA.USDT : (CONTRACTS.SPOKES as Record<string, any>)[selectedView].USDT, "USDT")}
                                            className="bg-primary/90 hover:bg-primary text-primary-foreground px-4 py-1.5 rounded-sm font-black text-[10px] uppercase cursor-pointer transition-all active:scale-95"
                                        >
                                            Deposit
                                        </button>
                                        <button
                                            onClick={() => openWithdrawModal(selectedView === 'USC' ? CONTRACTS.SPOKES.SEPOLIA.USDT : (CONTRACTS.SPOKES as Record<string, any>)[selectedView].USDT, "USDT")}
                                            className="border border-white/10 text-white/60 hover:text-white hover:bg-white/5 px-4 py-1.5 rounded-sm font-bold text-[10px] uppercase transition-all active:scale-95"
                                        >
                                            Withdraw
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-primary" />
                            <h2 className="text-white text-xs font-bold uppercase tracking-widest">Credit_Registry</h2>
                        </div>
                        <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col divide-y divide-white/5">
                            {activeLoans.length === 0 ? (
                                <div className="p-8 text-center text-white/20 text-[10px] uppercase">No Active Agreements</div>
                            ) : (
                                activeLoans.map((loan) => (
                                    <div key={loan.id} className="p-4 grid grid-cols-4 items-center gap-4">
                                        <span className="text-xs font-bold text-white uppercase">ID: #{loan.id}</span>
                                        <span className="text-xs text-white uppercase text-right">{loan.principal} USDC</span>
                                        <span className={`text-[9px] uppercase font-bold text-center ${loan.status === 0 ? 'text-primary' : 'text-white/40'}`}>
                                            {loan.status === 0 ? "LIVE" : "CLOSED"}
                                        </span>
                                        <div className="flex justify-end">
                                            {loan.status === 0 && (
                                                <button
                                                    onClick={() => executeRepay(loan.id, (loan.principal - loan.repaid).toString())}
                                                    className="bg-white/5 hover:bg-white/10 text-white text-[9px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest transition-all"
                                                >
                                                    Repay_Full
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Modals Updated for Multi-Chain Context */}
            <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                <DialogContent className="bg-zinc-950 border border-white/10 text-white font-mono rounded-lg shadow-2xl p-0 gap-0">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center text-white">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">SPOKE_DEPOSIT // {depositTarget?.chainKey}</span>
                    </div>
                    <div className="p-8 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <DialogTitle className="text-xl font-bold uppercase tracking-tighter">Deposit {depositTarget?.symbol}</DialogTitle>
                            <DialogDescription className="text-[10px] text-white/40 uppercase">
                                Funding the {depositTarget?.symbol} vault on {NETWORKS[depositTarget?.chainKey as keyof typeof NETWORKS]?.name}.
                            </DialogDescription>
                        </div>
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 text-2xl font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="0.00"
                        />
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={executeDeposit}
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground py-4 rounded-sm font-black text-xs uppercase cursor-pointer"
                            >
                                {loading ? "INITIALIZING..." : "CONFIRM DEPOSIT"}
                            </button>

                            <div className="flex justify-center">
                                <span className="text-[10px] text-white/40 uppercase cursor-pointer hover:text-white transition-colors border-b border-transparent hover:border-white/40" onClick={executeMint}>
                                    [ TESTNET FAUCET: MINT 1000 TOKENS ]
                                </span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isLoanOpen} onOpenChange={setIsLoanOpen}>
                <DialogContent className="bg-zinc-950 border border-white/10 text-white font-mono rounded-lg shadow-2xl p-0 gap-0">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">HUB_CREDIT_REQUEST</span>
                    </div>
                    <div className="p-8 flex flex-col gap-6">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tighter">Enter Loan Amount</DialogTitle>
                        <input
                            type="number"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 text-2xl font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                            onClick={executeLoan}
                            className="w-full bg-primary py-4 rounded-sm font-black text-xs uppercase"
                        >
                            REQUEST CREDIT
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sync proof and withdraw modals remain largely the same, just UI polish */}
            <Dialog open={isSyncOpen} onOpenChange={setIsSyncOpen}>
                <DialogContent className="bg-zinc-950 border border-white/10 text-white font-mono rounded-lg shadow-2xl p-0 gap-0">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">MANUAL_ORACLE_SYNC</span>
                    </div>
                    <div className="p-8 flex flex-col gap-6">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tighter">Sync Transaction</DialogTitle>
                        <DialogDescription className="text-[10px] text-white/40 uppercase">
                            Enter the Source Chain Transaction Hash to generate a proof and sync liquidity.
                        </DialogDescription>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase text-white/60">Source Tx Hash</label>
                            <input
                                value={syncProofData}
                                onChange={(e) => setSyncProofData(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-sm py-3 px-4 text-xs font-mono text-white focus:outline-none"
                                placeholder="0x..."
                            />
                        </div>

                        <button
                            onClick={async () => {
                                if (!syncProofData.startsWith("0x")) {
                                    toast.error("Invalid Hash");
                                    return;
                                }
                                try {
                                    toast.info("Generating Proof... (This may take a minute)");
                                    // Dynamically import to avoid server-side issues if any
                                    const { ProofUtils } = await import("@/lib/proof-utils");
                                    // Use Chain Key 1 (Sepolia) by default or detect from context?
                                    // Ideally we let user select, but for now assuming Sepolia (1)
                                    // If user is on Localnet, we use 1337
                                    const chainKey = selectedView === "USC" ? 1 : (NETWORKS[selectedView]?.id === 1337 ? 1337 : 1);

                                    const proof = await ProofUtils.fetchProof(syncProofData, chainKey);

                                    // Open Proof Viewer instead of auto-submit
                                    setLastDepositTx(syncProofData); // For display in viewer
                                    setGeneratedProof(proof);
                                    setIsProofViewerOpen(true);
                                    setIsSyncOpen(false); // Close input modal

                                    /* 
                                    toast.info("Proof Generated! Submitting to Hub...");
                                    await addLiquidityFromProof(proof);

                                    toast.success("Liquidity Synced Successfully!");
                                    setIsSyncOpen(false);
                                    setSyncProofData("");
                                    refreshData(); 
                                    */
                                } catch (e: any) {
                                    console.error(e);
                                    toast.error(e.message || "Sync Failed");
                                }
                            }}
                            className="w-full bg-white hover:bg-white/90 text-black py-4 font-black uppercase tracking-widest text-xs rounded-sm transition-all"
                        >
                            VERIFY_AND_SYNC
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                <DialogContent className="bg-zinc-950 border border-white/10 text-white font-mono rounded-lg shadow-2xl p-0 gap-0">
                    <div className="p-8 flex flex-col gap-6">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tighter">Withdraw Liquidity</DialogTitle>
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 py-4 px-6 text-2xl font-black text-white"
                        />
                        <button onClick={executeWithdrawal} className="w-full bg-red-500 py-4 font-black">REQUEST WITHDRAWAL</button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Proof Viewer Modal */}
            <Dialog open={isProofViewerOpen} onOpenChange={setIsProofViewerOpen}>
                <DialogContent className="bg-zinc-950 border border-white/10 text-white font-mono rounded-lg shadow-2xl p-0 gap-0 max-w-2xl">
                    <DialogTitle className="sr-only">Proof Explorer</DialogTitle>
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">NATIVE_VERIFICATION_LAYER // PROOF_EXPLORER</span>
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] text-green-500 font-bold uppercase">VERIFIED</span>
                        </div>
                    </div>
                    <div className="p-0 flex flex-col">
                        <div className="p-6 bg-black/50 overflow-x-auto max-h-[400px] text-[10px] text-white/70 font-mono">
                            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(generatedProof, (key, value) => {
                                if (key === 'siblings') return `[Array(${value.length})]`; // Truncate siblings for cleaner view
                                return value;
                            }, 2)}</pre>
                        </div>

                        <div className="p-6 border-t border-white/10 flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-white text-lg font-bold uppercase tracking-tighter">Oracle Verification Complete</span>
                                <span className="text-[10px] text-white/40 uppercase">
                                    The integrity of your deposit has been cryptographically verified by the Creditcoin V2 Oracle.
                                </span>
                                <span className="text-[10px] text-yellow-400 mt-2 uppercase font-bold animate-pulse">
                                    ⚠ Action Required: Submit this proof to the Network below.
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-sm border border-white/10">
                                    <span className="block text-[8px] text-white/40 uppercase tracking-widest mb-1">Merkle Root</span>
                                    <span className="block text-[10px] text-primary truncate">{generatedProof?.merkleRoot}</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded-sm border border-white/10">
                                    <span className="block text-[8px] text-white/40 uppercase tracking-widest mb-1">Tx Hash</span>
                                    <span className="block text-[10px] text-white/60 truncate">{lastDepositTx}</span>
                                </div>
                            </div>

                            <button
                                onClick={finalizeSync}
                                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground py-4 rounded-sm font-black text-xs uppercase cursor-pointer"
                            >
                                FINALIZE SYNC ON MASTER HUB
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </ConnectGate>
    )
}
