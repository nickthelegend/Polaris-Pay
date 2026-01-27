import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface BridgeTransaction {
    id: string;
    user_address: string;
    token_address: string;
    amount: string;
    source_tx_hash: string;
    usc_query_id: string;
    status: 'DETECTED' | 'BUILDING_PROOF' | 'SUBMITTED' | 'VERIFIED' | 'COMPLETED' | 'FAILED';
    created_at: string;
}

export function useBridge(userAddress: string | undefined) {
    const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userAddress) return;

        // Fetch existing
        const fetchTxs = async () => {
            const { data } = await supabase
                .from('bridge_transactions')
                .select('*')
                .eq('user_address', userAddress)
                .order('created_at', { ascending: false });

            if (data) setTransactions(data);
            setLoading(false);
        };

        fetchTxs();

        // Listen for real-time changes
        const channel = supabase
            .channel('bridge_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'bridge_transactions', filter: `user_address=eq.${userAddress}` },
                (payload) => {
                    const updatedTx = payload.new as BridgeTransaction;
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
