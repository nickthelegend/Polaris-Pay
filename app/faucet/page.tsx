"use client"
import { useState, useEffect } from "react"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { ethers, formatUnits } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CONTRACTS, NETWORKS, ABIS } from "@/lib/contracts"
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { usePolaris } from "@/hooks/use-polaris"

export default function FaucetPage() {
    const { authenticated } = usePrivy()
    const { wallets } = useWallets()
    const { getTokenBalance } = usePolaris()
    const [network, setNetwork] = useState<string>("SEPOLIA")
    const [token, setToken] = useState<string>("USDC")
    const [amount, setAmount] = useState<string>("1000")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [txHash, setTxHash] = useState<string>("")
    const [errorMsg, setErrorMsg] = useState<string>("")

    // Balances
    const [balances, setBalances] = useState<Record<string, string>>({})
    const [loadingBalances, setLoadingBalances] = useState(false)

    const TOKEN_LIST = {
        USDC: "Mock USDC",
        USDT: "Mock USDT",
        AVAX: "Mock AVAX",
        WBTC: "Mock WBTC",
        WETH: "Mock WETH",
        LINK: "Mock LINK",
        BNB: "Mock BNB"
    };

    const wallet = wallets[0]

    const fetchBalances = async () => {
        if (!wallet || !authenticated) return;
        setLoadingBalances(true);
        try {
            // @ts-ignore
            const netId = NETWORKS[network]?.id;
            // @ts-ignore
            const spokeConfig = CONTRACTS.SPOKES[network];

            if (netId && spokeConfig) {
                const balancesObj: any = {};
                for (const symbol of Object.keys(TOKEN_LIST)) {
                    if (spokeConfig[symbol]) {
                        try {
                            const b = await getTokenBalance(spokeConfig[symbol], netId);
                            balancesObj[symbol.toLowerCase()] = parseFloat(b).toFixed(2);
                        } catch (e) {
                            balancesObj[symbol.toLowerCase()] = "0.00";
                        }
                    }
                }
                setBalances(balancesObj);
            }
        } catch (e) {
            console.error("Failed to fetch balances:", e);
        } finally {
            setLoadingBalances(false);
        }
    };

    useEffect(() => {
        fetchBalances();
    }, [network, authenticated, wallet]);

    const handleMint = async () => {
        if (!wallet) return
        setStatus("loading")
        setErrorMsg("")
        setTxHash("")

        try {
            // Use the Backend API for a gasless experience (using the faucet wallet)
            const response = await fetch("/api/faucet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address: wallet.address,
                    token: token,
                    network: network,
                    amount: amount
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to mint from backend");
            }

            setTxHash(data.txHash);
            setStatus("success");

            // Refresh balances after a short delay to allow for indexing
            setTimeout(fetchBalances, 3000);
        } catch (e: any) {
            console.error(e)
            setStatus("error")
            setErrorMsg(e.message || "Failed to mint")
        }
    }

    return (
        <div className="container max-w-lg py-10">
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        Testnet Faucet 🚰
                        <Button variant="ghost" size="sm" onClick={fetchBalances} disabled={loadingBalances}>
                            <RefreshCw className={`h-4 w-4 ${loadingBalances ? 'animate-spin' : ''}`} />
                        </Button>
                    </CardTitle>
                    <CardDescription>Mint Mock USDC/USDT for testing on Sepolia/Hedera.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* Balances Card */}
                    {authenticated && (
                        <div className="bg-muted/50 p-4 rounded-lg grid grid-cols-2 gap-2">
                            <p className="col-span-2 text-xs font-semibold uppercase text-muted-foreground border-b border-white/5 pb-2 mb-1">Your {network} Balances</p>
                            {Object.entries(balances).map(([sym, bal]) => (
                                <div key={sym} className="flex justify-between items-center text-xs">
                                    <span className="opacity-50 uppercase">{sym}</span>
                                    <span className="font-mono font-medium">{bal}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Network</label>
                        <Select value={network} onValueChange={setNetwork}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SEPOLIA">Sepolia</SelectItem>
                                <SelectItem value="HEDERA">Hedera Testnet</SelectItem>
                                <SelectItem value="GANACHE">Localnet (Ganache)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Token</label>
                        <Select value={token} onValueChange={setToken}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(TOKEN_LIST).map(t => (
                                    <SelectItem key={t} value={t}>{TOKEN_LIST[t as keyof typeof TOKEN_LIST]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Amount</label>
                        <Select value={amount} onValueChange={setAmount}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="1000">1,000</SelectItem>
                                <SelectItem value="10000">10,000</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {status === "error" && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            {errorMsg?.slice(0, 50)}...
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col gap-1 p-3 text-sm text-green-500 bg-green-500/10 rounded-md">
                            <div className="flex items-center gap-2 font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                Minted Successfully!
                            </div>
                            {txHash && (
                                <a
                                    href={getExplorerLink(network, txHash)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs underline opacity-80 hover:opacity-100"
                                >
                                    View Transaction
                                </a>
                            )}
                        </div>
                    )}

                    <Button
                        className="w-full mt-4"
                        onClick={handleMint}
                        disabled={!authenticated || status === "loading"}
                    >
                        {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {authenticated ? "Mint Tokens" : "Connect Wallet First"}
                    </Button>

                </CardContent>
            </Card>
        </div>
    )
}

function getExplorerLink(network: string, hash: string) {
    // @ts-ignore
    const base = NETWORKS[network]?.explorer
    return base ? `${base}/tx/${hash}` : "#"
}
