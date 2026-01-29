
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  const { data: allTx, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Separate into recent transactions (spends) and bills
  // Logic: 'bill' category goes to bills, 'spend' goes to transactions
  // Or just separate by category as defined in schema
  const transactions = allTx.filter(t => t.category === 'spend' || t.category === 'repayment')
  const bills = allTx.filter(t => t.category === 'bill')

  return NextResponse.json({
    transactions: transactions.map(t => ({
      title: t.title,
      amount: t.amount,
      asset: t.asset
    })),
    bills: bills.map(b => ({
      title: b.title,
      amount: b.amount,
      asset: b.asset
    }))
  })
}
