import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface BridgeTransaction {
    id: string;
    user_address: string;
    token_address: string;
    amount: string;
    source_tx_hash: string;
    usc_query_id: string;
    status: 'DETECTED' | 'BUILDING_PROOF' | 'WAITING_ATTESTATION' | 'SUBMITTED' | 'VERIFIED' | 'COMPLETED' | 'FAILED';
    created_at: string;
}

export function useBridge(userAddress: string | undefined) {
    const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const mapStatus = (status: string) => {
        if (status === 'ProofGenerated') return 'VERIFIED';
        if (status === 'Synced') return 'COMPLETED';
        if (status === 'WaitingAttestation') return 'WAITING_ATTESTATION';
        return 'BUILDING_PROOF';
    };

    useEffect(() => {
        if (!userAddress) return;

        // Fetch existing
        const fetchTxs = async () => {
            const { data } = await supabase
                .from('deposits')
                .select('*')
                .eq('user_address', userAddress)
                .order('created_at', { ascending: false });

            if (data) {
                const formatted = data.map((d: any) => ({
                    id: d.id.toString(),
                    user_address: d.user_address,
                    token_address: d.token_address || "0x...", // Fallback
                    amount: d.amount ? d.amount.toString() : "0",
                    source_tx_hash: d.tx_hash,
                    usc_query_id: "",
                    status: mapStatus(d.status) as BridgeTransaction['status'],
                    created_at: d.created_at
                }));
                setTransactions(formatted);
            }
            setLoading(false);
        };

        fetchTxs();

        // Listen for real-time changes
        const channel = supabase
            .channel('deposits_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'deposits', filter: `user_address=eq.${userAddress}` },

                (payload) => {
                    const d = payload.new as any;
                    const updatedTx: BridgeTransaction = {
                        id: d.id.toString(),
                        user_address: d.user_address,
                        token_address: d.token_address || "0x...",
                        amount: d.amount ? d.amount.toString() : "0",
                        source_tx_hash: d.tx_hash,
                        usc_query_id: "",
                        status: mapStatus(d.status) as BridgeTransaction['status'],
                        created_at: d.created_at
                    };

                    setTransactions((prev) => {
                        const exists = prev.find(t => t.id === updatedTx.id);
                        if (exists) {
                            return prev.map(t => t.id === updatedTx.id ? updatedTx : t);
                        } else {
                            return [updatedTx, ...prev];
                        }
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userAddress]);

    return { transactions, loading };
}
