import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    const { billHash, txHash, userAddress } = body;

    if (!billHash || !txHash) {
        return NextResponse.json({ error: "Required fields: billHash, txHash" }, { status: 400 });
    }

    // 1. Update bill status on master
    const { data: bill, error: updateError } = await supabase
        .from('projects_bills')
        .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            tx_hash: txHash,
            user_address: userAddress
        })
        .eq('hash', billHash)
        .select('*, merchant_apps(name)')
        .single();

    if (updateError || !bill) {
        console.error("Payment settlement error:", updateError);
        return NextResponse.json({ error: "Failed to finalize payment" }, { status: 500 });
    }

    // 2. Log a synchronized spend record in user dashboard
    try {
        await supabase.from('transactions').insert({
            title: `Checkout: ${bill.merchant_apps.name}`,
            amount: bill.amount,
            asset: bill.asset,
            category: 'spend',
            status: 'verified',
            tx_hash: txHash,
            created_at: new Date().toISOString()
        });

        console.log(`[POLARIS] Settlement logged for ${bill.merchant_apps.name}`);
    } catch (logError) {
        console.error("Dashboard logging skipped:", logError);
    }

    return NextResponse.json({
        success: true,
        message: "Settlement confirmed",
        bill
    });
}
