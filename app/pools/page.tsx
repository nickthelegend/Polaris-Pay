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
    const { depositLiquidity, getPoolLiquidity, getTokenBalance, getLPBalance, getLocalVaultStats, loading, authenticated, chainId } = usePolaris();
    const [usdcLiquidity, setUsdcLiquidity] = useState("0");
    const [usdtLiquidity, setUsdtLiquidity] = useState("0");
    const [usdcUserBalance, setUsdcUserBalance] = useState("0");
    const [usdtUserBalance, setUsdtUserBalance] = useState("0");
    const [usdcLPBalance, setUsdcLPBalance] = useState("0");
    const [usdtLPBalance, setUsdtLPBalance] = useState("0");
    const [selectedNetwork, setSelectedNetwork] = useState<"USC" | "LOCAL">("USC");

    // Modal state
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [depositTarget, setDepositTarget] = useState<{ token: string, symbol: string } | null>(null);
    const [depositAmount, setDepositAmount] = useState("100");

    useEffect(() => {
        if (authenticated) {
            refreshData();
        }
    }, [authenticated, selectedNetwork]);

    const refreshData = async () => {
        try {
            // 1. Fetch Master Hub stats (Always needed for global context)
            const hubUsdcLiq = await getPoolLiquidity(CONTRACTS.SOURCE.USDC);
            const hubUsdtLiq = await getPoolLiquidity(CONTRACTS.SOURCE.USDT);
            const hubUsdcLP = await getLPBalance(CONTRACTS.SOURCE.USDC);
            const hubUsdtLP = await getLPBalance(CONTRACTS.SOURCE.USDT);

            // 2. Fetch Local Vault stats
            const vaultUsdc = await getLocalVaultStats(CONTRACTS.SOURCE.USDC);
            const vaultUsdt = await getLocalVaultStats(CONTRACTS.SOURCE.USDT);

            // 3. Update display state based on selected network context
            if (selectedNetwork === "LOCAL") {
                setUsdcLiquidity(vaultUsdc.total);
                setUsdtLiquidity(vaultUsdt.total);
                setUsdcLPBalance(vaultUsdc.user);
                setUsdtLPBalance(vaultUsdt.user);
            } else {
                setUsdcLiquidity(hubUsdcLiq);
                setUsdtLiquidity(hubUsdtLiq);
                setUsdcLPBalance(hubUsdcLP);
                setUsdtLPBalance(hubUsdtLP);
            }

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

    return (
        <ConnectGate>
            <div className="flex-1 flex flex-col py-8 gap-6 w-full font-mono text-white">
                {/* Page Header */}
                <div className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">System Status // core_protocol</span>
                    <h1 className="text-white text-xl tracking-tighter font-bold uppercase">Liquidity Pools Terminal</h1>
                </div>

                {/* Analytics Section */}
                <section className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center text-white">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">Consolidated_Summary // global_analytics</span>
                        <span className="text-primary text-[10px] animate-pulse flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            SIGNAL_STABLE
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10 text-white">
                        <div className="p-6 flex flex-col gap-1">
                            <span className="text-[10px] text-white/40 tracking-wider uppercase">Total_Value_Locked (TVL)</span>
                            <div className="flex items-baseline gap-2 text-white">
                                <span className="text-white text-3xl font-bold tracking-tighter">${(Number(usdcLiquidity) + Number(usdtLiquidity)).toLocaleString()}</span>
                                <span className="text-primary text-xs font-bold">+0.0%</span>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col gap-1">
                            <span className="text-[10px] text-white/40 tracking-wider uppercase">Protocol_Wide_APY</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-primary text-3xl font-bold tracking-tighter">8.42%</span>
                                <span className="text-white/40 text-[10px]">AVG_60D</span>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col gap-1">
                            <span className="text-[10px] text-white/40 tracking-wider uppercase">Your_Position_Value</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-white text-3xl font-bold tracking-tighter">${(Number(usdcLPBalance) + Number(usdtLPBalance)).toLocaleString()}</span>
                                <span className="text-white/40 text-[10px] uppercase">Net_Equity</span>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col gap-1">
                            <span className="text-[10px] text-white/40 tracking-wider uppercase">Health_Factor</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-white text-3xl font-bold tracking-tighter">2.41</span>
                                <span className="text-primary text-[10px] uppercase px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded-sm">Secure</span>
                            </div>
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
                                    onClick={refreshData}
                                    className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm hover:bg-white/10 transition-all text-[10px] text-white/70 uppercase tracking-widest group"
                                >
                                    <RefreshCw className={`w-3 h-3 text-primary group-hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin" : ""}`} />
                                    REFRESH
                                </button>
                                <div className="bg-white/5 border border-white/10 px-3 py-1 rounded flex items-center gap-2">
                                    <Search className="w-3 h-3 text-white/40" />
                                    <input
                                        className="bg-transparent border-none p-0 text-[10px] text-white focus:ring-0 placeholder:text-white/20 uppercase w-32 xl:w-48"
                                        placeholder="FILTER_POOL_OR_ASSET"
                                        type="text"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col flex-1 min-h-[600px]">
                            <div className="grid grid-cols-12 bg-white/5 border-b border-white/10 px-4 py-3 sticky top-0 z-10 backdrop-blur-sm">
                                <div className="col-span-4 flex items-center gap-1 cursor-pointer group">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest group-hover:text-primary transition-colors">Asset_Identifier</span>
                                    <ArrowDown className="w-3 h-3 text-primary" />
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Yield_APY</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Pool_Depth</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">My_Allocation</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Execute</span>
                                </div>
                            </div>

                            <div className="overflow-y-auto max-h-[800px] scrollbar-hide">
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
                                        <span className="text-primary font-bold text-sm">12.40%</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white/70 text-xs font-medium">${Number(usdcLiquidity).toLocaleString()}</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white text-xs">{Number(usdcLPBalance).toLocaleString()} <span className="text-[10px] text-white/40">USDC</span></span>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <button
                                            onClick={() => openDepositModal(CONTRACTS.SOURCE.USDC, "USDC")}
                                            className="bg-primary/90 hover:bg-primary text-primary-foreground px-2.5 py-1 rounded-sm font-black text-[9px] uppercase shadow-lg shadow-primary/5 transition-all disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            {loading ? "..." : "Deposit"}
                                        </button>
                                        <button className="border border-white/10 text-white/60 hover:text-white hover:bg-white/5 px-2.5 py-1 rounded-sm font-bold text-[9px] uppercase transition-all">Withdraw</button>
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
                                        <span className="text-primary font-bold text-sm">11.80%</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white/70 text-xs font-medium">${Number(usdtLiquidity).toLocaleString()}</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white text-xs">{Number(usdtLPBalance).toLocaleString()} <span className="text-[10px] text-white/20">USDT</span></span>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <button
                                            onClick={() => openDepositModal(CONTRACTS.SOURCE.USDT, "USDT")}
                                            className="bg-primary/90 hover:bg-primary text-primary-foreground px-2.5 py-1 rounded-sm font-black text-[9px] uppercase shadow-lg shadow-primary/5 transition-all disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            {loading ? "..." : "Deposit"}
                                        </button>
                                        <button className="border border-white/10 text-white/60 hover:text-white hover:bg-white/5 px-2.5 py-1 rounded-sm font-bold text-[9px] uppercase transition-all">Withdraw</button>
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
                                        <span className="text-primary font-bold text-sm">18.20%</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white/70 text-xs font-medium">$850K</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white text-xs">450.00 <span className="text-[10px] text-white/40">CTC</span></span>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <button className="bg-primary/90 hover:bg-primary text-primary-foreground px-2.5 py-1 rounded-sm font-black text-[9px] uppercase shadow-lg shadow-primary/5 transition-all">Stake</button>
                                        <button className="border border-white/10 text-white/60 hover:text-white hover:bg-white/5 px-2.5 py-1 rounded-sm font-bold text-[9px] uppercase transition-all">Unstake</button>
                                    </div>
                                </div>

                                {/* Pool Row: WBTC (Locked) */}
                                <div className="grid grid-cols-12 px-4 py-4 border-b border-white/5 items-center opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed group">
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="size-8 bg-white/10 rounded-sm flex items-center justify-center border border-white/10 transition-colors">
                                            <Lock className="w-4 h-4 text-white/40" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white/60 text-xs font-bold uppercase tracking-tight">WBTC_CORE</span>
                                            <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold font-mono">MAINTENANCE_MODE</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-primary/60 font-bold text-sm">4.10%</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white/40 text-xs font-medium">$1.8M</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white/40 text-xs">0.00</span>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <button className="bg-primary/20 text-primary px-2.5 py-1 rounded-sm font-black text-[9px] uppercase cursor-not-allowed">Offline</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                <DialogContent className="bg-zinc-950 border border-white/10 text-white font-mono rounded-lg shadow-2xl overflow-hidden p-0 gap-0">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">Protocol_Input // liquidity_provision</span>
                        <span className="text-primary text-[10px] animate-pulse">AWAITING_QUANTITY</span>
                    </div>

                    <div className="p-6 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl font-bold uppercase tracking-tighter">Enter Deposit Amount</h2>
                            <p className="text-[10px] text-white/40 uppercase leading-relaxed">
                                Provide liquidity to the {depositTarget?.symbol} pool on LOCALNET.
                                Funds will be locked in the source vault.
                            </p>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Wallet className="w-4 h-4 text-primary opacity-50" />
                            </div>
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-10 pr-4 text-white font-bold text-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-white/10"
                                placeholder="0.00"
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <span className="text-[10px] font-bold text-white/40">{depositTarget?.symbol}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={executeDeposit}
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground py-3 rounded-sm font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all disabled:opacity-50 active:scale-95"
                            >
                                {loading ? "TRANSACTING..." : "Confirm_Deposit"}
                            </button>
                            <button
                                onClick={() => setIsDepositOpen(false)}
                                className="w-full bg-transparent hover:bg-white/5 text-white/40 hover:text-white/60 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-all"
                            >
                                Cancel_Request
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/5 px-4 py-1.5 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[9px] text-white/20 uppercase">Network: LOCALNET</span>
                        <div className="flex gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary/20" />
                            <div className="w-1 h-1 rounded-full bg-primary/20" />
                            <div className="w-1 h-1 rounded-full bg-primary/20" />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </ConnectGate>
    )
}
