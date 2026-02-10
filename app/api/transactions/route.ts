
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  // 1. Fetch from 'transactions' table (Spends, Repayments, Bills)
  const { data: allTx, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  // 2. Fetch from 'deposits' table (Pool Deposits)
  const { data: allDeposits, error: depError } = await supabase
    .from('deposits')
    .select('*')
    .order('created_at', { ascending: false })

  // 3. Fetch from 'bridge_transactions' table (Cross-chain bridges)
  const { data: allBridges, error: brError } = await supabase
    .from('bridge_transactions')
    .select('*')
    .order('created_at', { ascending: false })

  if (txError || depError || brError) {
    return NextResponse.json({ error: txError?.message || depError?.message || brError?.message }, { status: 500 })
  }

  // Combine and format
  const transactions = (allTx || []).filter(t => t.category === 'spend' || t.category === 'repayment').map(t => ({
    type: 'transaction',
    title: t.title,
    amount: t.amount,
    asset: t.asset,
    created_at: t.created_at,
    tx_hash: t.tx_hash,
    category: t.category
  }))

  const bills = (allTx || []).filter(t => t.category === 'bill').map(b => ({
    type: 'bill',
    title: b.title,
    amount: b.amount,
    asset: b.asset,
    created_at: b.created_at,
    category: 'bill'
  }))

  const deposits = (allDeposits || []).map(d => ({
    type: 'deposit',
    title: `Deposit to ${d.token_address?.slice(0, 6)}... Vault`,
    amount: d.amount,
    asset: d.token_address?.toLowerCase().includes("a715") ? "USDC" : "USDT", // Map back from addr if possible
    created_at: d.created_at,
    tx_hash: d.tx_hash,
    status: d.status,
    chain_id: d.chain_key
  }))

  const bridges = (allBridges || []).map(br => ({
    type: 'bridge',
    title: 'Cross-chain Bridge',
    amount: br.amount,
    asset: br.token_address?.toLowerCase().includes("a715") ? "USDC" : "USDT",
    created_at: br.created_at,
    tx_hash: br.source_tx_hash,
    status: br.status,
    source_chain_id: br.source_chain_id
  }))

  return NextResponse.json({
    transactions,
    bills,
    deposits,
    bridges
  })
}
