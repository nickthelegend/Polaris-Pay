"use client"

import { useBridge, BridgeTransaction } from "@/hooks/use-bridge"
import { RefreshCw, ExternalLink, CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface BridgeStatusProps {
    address: string | undefined;
}

export function BridgeStatus({ address }: BridgeStatusProps) {
    const { transactions, loading } = useBridge(address);

    if (!address || (transactions.length === 0 && !loading)) return null;

    const getStatusIcon = (status: BridgeTransaction['status']) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="w-3 h-3 text-primary" />;
            case 'FAILED': return <AlertCircle className="w-3 h-3 text-red-500" />;
            case 'DETECTED':
            case 'BUILDING_PROOF':
            case 'WAITING_ATTESTATION':
            case 'SUBMITTED':
            case 'VERIFIED':
                return <Clock className="w-3 h-3 text-yellow-500 animate-pulse" />;
            default: return null;
        }
    };

    const getStatusLabel = (status: BridgeTransaction['status']) => {
        switch (status) {
            case 'DETECTED': return 'Deposit Detected';
            case 'BUILDING_PROOF': return 'Building Proof';
            case 'WAITING_ATTESTATION': return 'Waiting for Creditcoin Attestation (10m)';
            case 'SUBMITTED': return 'Verifying on USC Hub (5m)';
            case 'VERIFIED': return 'Verified (Finalizing)';
            case 'COMPLETED': return 'Ready on USC Hub';
            default: return status;
        }
    };

    return (
        <div className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl flex flex-col mt-6">
            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center overflow-hidden">
                <span className="text-[10px] text-white/40 uppercase tracking-widest whitespace-nowrap">Cross_Chain_Bridge_Monitor</span>
                {loading && <RefreshCw className="w-2.5 h-2.5 text-primary animate-spin" />}
            </div>
            <div className="max-h-[200px] overflow-y-auto">
                {transactions.length === 0 ? (
                    <div className="p-4 text-center text-[10px] text-white/20 uppercase">No active bridge transfers</div>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className="p-3 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-all">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">
                                        Bridging {tx.amount} {tx.token_address.toLowerCase().includes('a715') || tx.token_address.toLowerCase().includes('8437') ? 'USDC' : 'USDT'}
                                    </span>
                                    <span className="text-[8px] text-white/30 font-mono">{tx.source_tx_hash.slice(0, 6)}...</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {getStatusIcon(tx.status)}
                                    <span className={`text-[9px] uppercase font-bold tracking-wider ${tx.status === 'COMPLETED' ? 'text-primary' : 'text-white/60'}`}>
                                        {getStatusLabel(tx.status)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${tx.source_tx_hash}`}
                                    target="_blank"
                                    className="p-1.5 hover:bg-white/10 rounded-sm transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3 text-white/40" />
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
