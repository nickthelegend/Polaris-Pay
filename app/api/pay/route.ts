import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const amount = Number(body?.amount ?? 0)
  const note = String(body?.note ?? "Execute Payment")

  // Create a realistic mock hash for the demo
  const txId = `0x${Math.random().toString(16).slice(2, 42)}`
  const explorerUrl = `https://explorer.usc-testnet2.creditcoin.network/tx/${txId}`

  // Save to Database so it shows up in /transactions
  try {
    await supabase.from('transactions').insert({
      title: note,
      amount,
      asset: 'USDC',
      category: 'spend',
      status: 'verified',
      tx_hash: txId,
      created_at: new Date().toISOString()
    })
  } catch (e) {
    console.error("Failed to log transaction", e)
  }

  return NextResponse.json({ txId, explorerUrl })
}
