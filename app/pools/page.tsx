"use client"

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

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

export default function PoolsPage() {
    const {
        depositLiquidity,
        addLiquidityFromProof,
        requestWithdrawal,
        getPoolLiquidity,
        getTokenBalance,
        getLPBalance,
        getLocalVaultStats,
        getInsuranceStats,
        loading,
        authenticated,
        chainId,
        getScore,
        getCreditLimit,
        createLoan,
        repayLoan,
        getLoans
    } = usePolaris();

    // Liquidity & Balance State
    const [usdcLiquidity, setUsdcLiquidity] = useState("0");
    const [usdtLiquidity, setUsdtLiquidity] = useState("0");
    const [ctcLiquidity, setCtcLiquidity] = useState("0");
    const [usdcUserBalance, setUsdcUserBalance] = useState("0");
    const [usdtUserBalance, setUsdtUserBalance] = useState("0");
    const [usdcLPBalance, setUsdcLPBalance] = useState("0");
    const [usdtLPBalance, setUsdtLPBalance] = useState("0");
    const [ctcLPBalance, setCtcLPBalance] = useState("0");
    const [selectedNetwork, setSelectedNetwork] = useState<"USC" | "LOCAL">("USC");

    // Credit & Loan State
    const [userScore, setUserScore] = useState("0");
    const [creditLimit, setCreditLimit] = useState("0");
    const [activeLoans, setActiveLoans] = useState<any[]>([]);

    // Modal State
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [depositTarget, setDepositTarget] = useState<{ token: string, symbol: string } | null>(null);
    const [depositAmount, setDepositAmount] = useState("100");

    const [isLoanOpen, setIsLoanOpen] = useState(false);
    const [loanAmount, setLoanAmount] = useState("50");

    // Bridge State
    const [isSyncOpen, setIsSyncOpen] = useState(false);
    const [syncQueryId, setSyncQueryId] = useState("");

    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("50");
    const [withdrawTarget, setWithdrawTarget] = useState<{ token: string, symbol: string } | null>(null);

    useEffect(() => {
        if (authenticated) {
            refreshData();
        }
    }, [authenticated, selectedNetwork]);

    const refreshData = async () => {
        try {
            console.log(`[POLARIS] Refreshing data for network: ${selectedNetwork}...`);

            // 1. Fetch Master Hub stats (Liquidity)
            const hubUsdcLiq = await getPoolLiquidity(CONTRACTS.SOURCE.USDC);
            const hubUsdtLiq = await getPoolLiquidity(CONTRACTS.SOURCE.USDT);
            const hubUsdcLP = await getLPBalance(CONTRACTS.SOURCE.USDC);
            const hubUsdtLP = await getLPBalance(CONTRACTS.SOURCE.USDT);

            // Insurance Pool (Always from USC)
            const ctcStats = await getInsuranceStats();
            setCtcLiquidity(ctcStats.total);
            setCtcLPBalance(ctcStats.user);

            // 2. Fetch Local Vault stats
            const vaultUsdc = await getLocalVaultStats(CONTRACTS.SOURCE.USDC);
            const vaultUsdt = await getLocalVaultStats(CONTRACTS.SOURCE.USDT);

            // 3. Score & Loans (Hub Only)
            const score = await getScore();
            setUserScore(score);
            const limit = await getCreditLimit(CONTRACTS.SOURCE.USDC); // Check USDC limit
            setCreditLimit(limit);

            const loans = await getLoans();
            setActiveLoans(loans);

            let currentUsdcDepth = "0";
            let currentUsdtDepth = "0";
            let currentUserUsdc = "0";
            let currentUserUsdt = "0";

            // 4. Update display state based on selected network context
            if (selectedNetwork === "LOCAL") {
                currentUsdcDepth = vaultUsdc.total;
                currentUsdtDepth = vaultUsdt.total;
                currentUserUsdc = vaultUsdc.user;
                currentUserUsdt = vaultUsdt.user;
            } else {
                currentUsdcDepth = hubUsdcLiq;
                currentUsdtDepth = hubUsdtLiq;
                currentUserUsdc = hubUsdcLP;
                currentUserUsdt = hubUsdtLP;
            }

            setUsdcLiquidity(currentUsdcDepth);
            setUsdtLiquidity(currentUsdtDepth);
            setUsdcLPBalance(currentUserUsdc);
            setUsdtLPBalance(currentUserUsdt);

            // Validation Logs
            const totalTVL = Number(currentUsdcDepth) + Number(currentUsdtDepth) + Number(ctcStats.total);
            console.log("\n--- [TVL_VALIDATION_REPORT] ---");
            console.log(`[USDC_DEPTH]: $${currentUsdcDepth}`);
            console.log(`[SCORE]: ${score}`);
            console.log("-------------------------------\n");

            // Wallet balances from selected network
            const net = NETWORKS[selectedNetwork];
            const ubUsdc = await getTokenBalance(CONTRACTS.SOURCE.USDC, net.id);
            const ubUsdt = await getTokenBalance(CONTRACTS.SOURCE.USDT, net.id);
            setUsdcUserBalance(ubUsdc);
            setUsdtUserBalance(ubUsdt);
        } catch (err) {
            console.error("Refresh failed:", err);
        }
    };

    const handleNetworkChange = (net: "USC" | "LOCAL") => {
        setSelectedNetwork(net);
        toast.info(`View updated to ${NETWORKS[net].name}`);
    };

    const openDepositModal = (token: string, symbol: string) => {
        if (selectedNetwork !== "LOCAL") {
            toast.warn("Switch to LOCALNET to deposit tokens");
            return;
        }
        setDepositTarget({ token, symbol });
        setIsDepositOpen(true);
    };

    const executeDeposit = async () => {
        if (!depositTarget) return;
        try {
            toast.info(`Initiating ${depositAmount} ${depositTarget.symbol} deposit...`);
            await depositLiquidity(depositTarget.token, depositAmount);
            toast.success("Deposit successful! Liquidity locked.");
            setIsDepositOpen(false);
            refreshData();
        } catch (error) {
            console.error("Deposit error:", error);
            toast.error("Deposit failed. Check console for details.");
        }
    };

    const executeLoan = async () => {
        try {
            toast.info(`Requesting ${loanAmount} USDC Loan...`);
            await createLoan(loanAmount, CONTRACTS.SOURCE.USDC);
            toast.success("Loan Approved & Funded!");
            setIsLoanOpen(false);
            refreshData();
        } catch (error) {
            console.error("Loan failed:", error);
            toast.error("Loan request rejected. Check console.");
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
            toast.info("Submitting query proof to Hub...");
            await addLiquidityFromProof(syncQueryId);
            toast.success("Liquidity Synced Successfully!");
            setIsSyncOpen(false);
            setSyncQueryId("");
            refreshData();
        } catch (error) {
            console.error("Sync failed:", error);
            toast.error("Sync failed. Check query ID.");
        }
    };

    const openWithdrawModal = (token: string, symbol: string) => {
        if (selectedNetwork !== "USC") {
            toast.warn("Switch to USC Master Hub to withdraw tokens");
            return;
        }
        setWithdrawTarget({ token, symbol });
        setIsWithdrawOpen(true);
    };

    const executeWithdrawal = async () => {
        if (!withdrawTarget) return;
        try {
            toast.info(`Initiating withdrawal of ${withdrawAmount} ${withdrawTarget.symbol}...`);
            await requestWithdrawal(withdrawTarget.token, withdrawAmount);
            toast.success("Withdrawal Authorized! Process proof in spoke chain.");
            setIsWithdrawOpen(false);
            refreshData();
        } catch (error) {
            console.error("Withdrawal failed:", error);
            toast.error("Withdrawal failed.");
        }
    };

    return (
        <ConnectGate>
            <div className="flex-1 flex flex-col py-8 gap-6 w-full font-mono text-white">
                {/* Page Header */}
                <div className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">System Status // core_protocol</span>
                    <h1 className="text-white text-xl tracking-tighter font-bold uppercase">Liquidity Pools Terminal</h1>
                </div>

                {/* Credit Score & Analytics Section */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* TVL Card */}
                    <div className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl col-span-2">
                        <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center text-white">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest">Consolidated_Summary</span>
                            <span className="text-primary text-[10px] animate-pulse flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                SIGNAL_STABLE
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 text-white">
                            <div className="p-6 flex flex-col gap-1">
                                <span className="text-[10px] text-white/40 tracking-wider uppercase">Total_Value_Locked (TVL)</span>
                                <div className="flex items-baseline gap-2 text-white">
                                    <span className="text-white text-3xl font-bold tracking-tighter">${(Number(usdcLiquidity) + Number(usdtLiquidity) + Number(ctcLiquidity)).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col gap-1">
                                <span className="text-[10px] text-white/40 tracking-wider uppercase">Your_Position_Value</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-white text-3xl font-bold tracking-tighter">${(Number(usdcLPBalance) + Number(usdtLPBalance) + Number(ctcLPBalance)).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col gap-1">
                                <span className="text-[10px] text-white/40 tracking-wider uppercase">Active_Loans</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-primary text-3xl font-bold tracking-tighter">{activeLoans.filter(l => l.status === 0).length}</span>
                                    <span className="text-white/40 text-[10px] uppercase">OPEN</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Credit Score Card */}
                    <div className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl flex flex-col">
                        <div className="bg-white/5 px-4 py-2 border-b border-white/10 text-white">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest">Risk_Assessment // FICO_On_Chain</span>
                        </div>
                        <div className="p-6 flex flex-col gap-4 flex-1 justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldCheck className="w-24 h-24 text-primary" />
                            </div>
                            <div className="flex flex-col gap-1 z-10">
                                <span className="text-[10px] text-white/40 tracking-wider uppercase">Credit_Score</span>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-black tracking-tighter ${Number(userScore) > 700 ? 'text-primary' : Number(userScore) > 500 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {userScore}
                                    </span>
                                    <span className="text-white/40 text-[10px] font-bold">/ 850</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 z-10">
                                <span className="text-[10px] text-white/40 tracking-wider uppercase">Borrowing_Power (USDC)</span>
                                <span className="text-white text-xl font-bold tracking-tight">${Number(creditLimit).toLocaleString()}</span>
                            </div>

                            <button
                                onClick={() => setIsLoanOpen(true)}
                                className="mt-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-all"
                            >
                                Request_New_Loan
                            </button>
                        </div>
                    </div>
                </section>

                <div className="flex flex-col gap-6">
                    {/* Main Terminal Section */}
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <LayoutDashboard className="w-4 h-4 text-primary" />
                                <h2 className="text-white text-xs font-bold uppercase tracking-widest">Liquidity_Pools_Terminal</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm hover:bg-white/10 transition-all cursor-pointer">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full neon-glow" />
                                            <span className="text-[10px] text-white/70 tracking-widest uppercase">
                                                {selectedNetwork === "USC" ? "NETWORK: USC HUB" : "NETWORK: LOCALNET"}
                                            </span>
                                            <ChevronDown className="w-3 h-3 text-white/40" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10">
                                        <DropdownMenuItem onClick={() => handleNetworkChange("USC")} className="text-[10px] uppercase font-bold tracking-tighter cursor-pointer focus:bg-primary/20">
                                            USC Master Hub
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleNetworkChange("LOCAL")} className="text-[10px] uppercase font-bold tracking-tighter cursor-pointer focus:bg-primary/20">
                                            Localnet Hub (Source)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <button
                                    onClick={() => setIsSyncOpen(true)}
                                    className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-sm hover:bg-primary/20 transition-all text-[10px] text-primary uppercase tracking-widest group"
                                >
                                    <Zap className="w-3 h-3 animate-pulse" />
                                    SYNC_PROOF
                                </button>

                                <button
                                    onClick={refreshData}
                                    className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm hover:bg-white/10 transition-all text-[10px] text-white/70 uppercase tracking-widest group"
                                >
                                    <RefreshCw className={`w-3 h-3 text-primary group-hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin" : ""}`} />
                                    REFRESH
                                </button>
                            </div>
                        </div>

                        <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col flex-1 min-h-[400px]">
                            {/* Pool List Header */}
                            <div className="grid grid-cols-12 bg-white/5 border-b border-white/10 px-4 py-3 sticky top-0 z-10 backdrop-blur-sm">
                                <div className="col-span-4 flex items-center gap-1 cursor-pointer group">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest group-hover:text-primary transition-colors">Asset_Identifier</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Pool_Depth</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">My_Allocation</span>
                                </div>
                                <div className="col-span-4 text-right">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Execute</span>
                                </div>
                            </div>

                            <div className="overflow-y-auto max-h-[600px] scrollbar-hide">
                                {/* Pool Row: USDC */}
                                <div className="grid grid-cols-12 px-4 py-4 border-b border-white/5 hover:bg-white/[0.04] transition-all items-center group">
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="size-8 bg-blue-500/10 rounded-sm flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/40 transition-colors">
                                            <Coins className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white text-xs font-bold uppercase tracking-tight">USDC_POOL</span>
                                            <span className="text-[9px] text-white/30">ID: 0x481...2A</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white/70 text-xs font-medium">${Number(usdcLiquidity).toLocaleString()}</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white text-xs">{Number(usdcLPBalance).toLocaleString()} <span className="text-[10px] text-white/40">USDC</span></span>
                                    </div>
                                    <div className="col-span-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => openDepositModal(CONTRACTS.SOURCE.USDC, "USDC")}
                                            className="bg-primary/90 hover:bg-primary text-primary-foreground px-2.5 py-1 rounded-sm font-black text-[9px] uppercase shadow-lg shadow-primary/5 transition-all disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            {loading ? "..." : "Deposit"}
                                        </button>
                                        <button
                                            onClick={() => openWithdrawModal(CONTRACTS.SOURCE.USDC, "USDC")}
                                            className="border border-white/10 text-white/60 hover:text-white hover:bg-white/5 px-2.5 py-1 rounded-sm font-bold text-[9px] uppercase transition-all"
                                        >
                                            Withdraw
                                        </button>
                                    </div>
                                </div>

                                {/* Pool Row: USDT */}
                                <div className="grid grid-cols-12 px-4 py-4 border-b border-white/5 hover:bg-white/[0.04] transition-all items-center group">
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="size-8 bg-green-500/10 rounded-sm flex items-center justify-center border border-green-500/20 group-hover:border-green-500/40 transition-colors">
                                            <Coins className="w-4 h-4 text-green-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white text-xs font-bold uppercase tracking-tight">USDT_POOL</span>
                                            <span className="text-[9px] text-white/30">ID: 0x219...9B</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white/70 text-xs font-medium">${Number(usdtLiquidity).toLocaleString()}</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white text-xs">{Number(usdtLPBalance).toLocaleString()} <span className="text-[10px] text-white/20">USDT</span></span>
                                    </div>
                                    <div className="col-span-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => openDepositModal(CONTRACTS.SOURCE.USDT, "USDT")}
                                            className="bg-primary/90 hover:bg-primary text-primary-foreground px-2.5 py-1 rounded-sm font-black text-[9px] uppercase shadow-lg shadow-primary/5 transition-all disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            {loading ? "..." : "Deposit"}
                                        </button>
                                        <button
                                            onClick={() => openWithdrawModal(CONTRACTS.SOURCE.USDT, "USDT")}
                                            className="border border-white/10 text-white/60 hover:text-white hover:bg-white/5 px-2.5 py-1 rounded-sm font-bold text-[9px] uppercase transition-all"
                                        >
                                            Withdraw
                                        </button>
                                    </div>
                                </div>

                                {/* Pool Row: CTC */}
                                <div className="grid grid-cols-12 px-4 py-4 border-b border-white/5 hover:bg-white/[0.04] transition-all items-center group">
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="size-8 bg-purple-500/10 rounded-sm flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/40 transition-colors">
                                            <Coins className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white text-xs font-bold uppercase tracking-tight">CTC_STAKING</span>
                                            <span className="text-[9px] text-white/30">ID: 0xCTC...01</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white/70 text-xs font-medium">${Number(ctcLiquidity).toLocaleString()}</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white text-xs">{Number(ctcLPBalance).toLocaleString()} <span className="text-[10px] text-white/40">CTC</span></span>
                                    </div>
                                    <div className="col-span-4 flex justify-end gap-2">
                                        <button className="bg-primary/90 hover:bg-primary text-primary-foreground px-2.5 py-1 rounded-sm font-black text-[9px] uppercase shadow-lg shadow-primary/5 transition-all">Stake</button>
                                        <button
                                            onClick={() => openWithdrawModal(CONTRACTS.SOURCE.CTC, "CTC")}
                                            className="border border-white/10 text-white/60 hover:text-white hover:bg-white/5 px-2.5 py-1 rounded-sm font-bold text-[9px] uppercase transition-all"
                                        >
                                            Unstake
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Active Loans Section */}
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-primary" />
                            <h2 className="text-white text-xs font-bold uppercase tracking-widest">Active_Loans_Ledger</h2>
                        </div>

                        <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col">
                            {activeLoans.length === 0 ? (
                                <div className="p-8 text-center text-white/30 text-xs font-mono uppercase tracking-widest">
                                    No Active Loans Found
                                </div>
                            ) : (
                                activeLoans.map((loan) => (
                                    <div key={loan.id} className="grid grid-cols-12 px-4 py-4 border-b border-white/5 hover:bg-white/[0.04] transition-all items-center">
                                        <div className="col-span-2">
                                            <span className="text-white text-xs font-bold">Loan #{loan.id}</span>
                                        </div>
                                        <div className="col-span-3 text-right">
                                            <span className="text-white text-xs">{loan.principal} USDC</span>
                                            <span className="block text-[9px] text-white/40">Principal</span>
                                        </div>
                                        <div className="col-span-3 text-right">
                                            <span className="text-primary text-xs">{loan.principal - loan.repaid} USDC</span>
                                            <span className="block text-[9px] text-white/40">Remaining</span>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${loan.status === 0 ? 'border-primary/40 text-primary bg-primary/10' : 'border-white/20 text-white/40'}`}>
                                                {loan.status === 0 ? "ACTIVE" : loan.status === 1 ? "REPAID" : "DEFAULT"}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            {loan.status === 0 && (
                                                <button
                                                    onClick={() => executeRepay(loan.id, (loan.principal - loan.repaid).toString())}
                                                    className="bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-sm text-[9px] uppercase font-bold"
                                                >
                                                    Repay Full
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

            {/* Deposit Modal */}
            <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                <DialogContent className="bg-zinc-950 border border-white/10 text-white font-mono rounded-lg shadow-2xl p-0 gap-0">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">Protocol_Input // liquidity_provision</span>
                        <span className="text-primary text-[10px] animate-pulse">AWAITING_QUANTITY</span>
                    </div>
                    <div className="p-6 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl font-bold uppercase tracking-tighter">Enter Deposit Amount</h2>
                            <p className="text-[10px] text-white/40 uppercase leading-relaxed">
                                Provide liquidity to the {depositTarget?.symbol} pool on LOCALNET.
                            </p>
                        </div>
                        <div className="relative group">
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-4 pr-4 text-white font-bold text-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="0.00"
                            />
                        </div>
                        <button
                            onClick={executeDeposit}
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground py-3 rounded-sm font-black text-xs uppercase cursor-pointer"
                        >
                            {loading ? "Transacting..." : "Confirm Deposit"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Loan Request Modal */}
            <Dialog open={isLoanOpen} onOpenChange={setIsLoanOpen}>
                <DialogContent className="bg-zinc-950 border border-white/10 text-white font-mono rounded-lg shadow-2xl p-0 gap-0">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">BNPL_Request // Master_Hub</span>
                    </div>
                    <div className="p-6 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl font-bold uppercase tracking-tighter">Request Loan (USDC)</h2>
                            <p className="text-[10px] text-white/40 uppercase">
                                Your max limit is {creditLimit} USDC based on your Score of {userScore}.
                            </p>
                        </div>
                        <div className="relative group">
                            <input
                                type="number"
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-4 pr-4 text-white font-bold text-lg focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <button
                            onClick={executeLoan}
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground py-3 rounded-sm font-black text-xs uppercase cursor-pointer"
                        >
                            {loading ? "Processing..." : "Create Loan"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Sync Proof Modal */}
            <Dialog open={isSyncOpen} onOpenChange={setIsSyncOpen}>
                <DialogContent className="bg-zinc-950 border border-white/10 text-white font-mono rounded-lg shadow-2xl p-0 gap-0">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">Oracle_Synchronization // master_hub</span>
                        <span className="text-primary text-[10px] animate-pulse">AWAITING_QUERY_ID</span>
                    </div>
                    <div className="p-6 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl font-bold uppercase tracking-tighter">Sync Liquidity Proof</h2>
                            <p className="text-[10px] text-white/40 uppercase">
                                Enter the Query ID provided by the Oracle Relayer to finalize your deposit on the Hub.
                            </p>
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                value={syncQueryId}
                                onChange={(e) => setSyncQueryId(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-sm py-3 px-4 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="0x..."
                            />
                        </div>
                        <button
                            onClick={executeSyncProof}
                            disabled={loading || !syncQueryId}
                            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground py-3 rounded-sm font-black text-xs uppercase cursor-pointer disabled:opacity-50"
                        >
                            {loading ? "Syncing..." : "Finalize Deposit"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Withdrawal Modal */}
            <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                <DialogContent className="bg-zinc-950 border border-white/10 text-white font-mono rounded-lg shadow-2xl p-0 gap-0">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">Hub_Withdrawal // authorization_request</span>
                    </div>
                    <div className="p-6 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl font-bold uppercase tracking-tighter">Withdraw {withdrawTarget?.symbol}</h2>
                            <p className="text-[10px] text-white/40 uppercase">
                                Authorized withdrawals will be emitted to the reverse bridge.
                            </p>
                        </div>
                        <div className="relative group">
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-sm py-3 px-4 text-white font-bold text-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="0.00"
                            />
                        </div>
                        <button
                            onClick={executeWithdrawal}
                            disabled={loading}
                            className="w-full bg-red-500 hover:bg-red-400 text-white py-3 rounded-sm font-black text-xs uppercase cursor-pointer"
                        >
                            {loading ? "Authorizing..." : "Request Withdrawal"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </ConnectGate>
    )
}
