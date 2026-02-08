"use client"

import { useState } from "react"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CONTRACTS, NETWORKS, ABIS } from "@/lib/contracts"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function FaucetPage() {
    const { authenticated } = usePrivy()
    const { wallets } = useWallets()
    const [network, setNetwork] = useState<string>("SEPOLIA")
    const [token, setToken] = useState<string>("USDC")
    const [amount, setAmount] = useState<string>("1000")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [txHash, setTxHash] = useState<string>("")
    const [errorMsg, setErrorMsg] = useState<string>("")

    const wallet = wallets[0]

    const handleMint = async () => {
        if (!wallet) return
        setStatus("loading")
        setErrorMsg("")
        setTxHash("")

        try {
            // Switch chain if needed
            // @ts-ignore
            const targetChainId = NETWORKS[network]?.id
            if (targetChainId) {
                await wallet.switchChain(targetChainId)
            }

            // Get provider
            const provider = new ethers.BrowserProvider(await wallet.getEthereumProvider())
            const signer = await provider.getSigner()

            // Get contract address based on network/token
            // @ts-ignore
            const networkConfig = CONTRACTS.SPOKES[network]
            if (!networkConfig) throw new Error("Invalid network config")

            const tokenAddress = networkConfig[token]
            if (!tokenAddress) throw new Error("Invalid token address")

            const contract = new ethers.Contract(tokenAddress, ABIS.MockERC20, signer)

            // Mint
            const parsedAmount = ethers.parseUnits(amount, 6) // USDC/USDT use 6 decimals
            const tx = await contract.mint(wallet.address, parsedAmount)

            setTxHash(tx.hash)
            await tx.wait()

            setStatus("success")
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
                    <CardTitle>Testnet Faucet 🚰</CardTitle>
                    <CardDescription>Mint Mock USDC/USDT for testing on Sepolia/Hedera.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

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
                                <SelectItem value="USDC">Mock USDC</SelectItem>
                                <SelectItem value="USDT">Mock USDT</SelectItem>
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
                            {errorMsg}
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
