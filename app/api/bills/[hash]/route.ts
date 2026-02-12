import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ hash: string }> }
) {
    const { hash } = await params;

    if (!hash) {
        return NextResponse.json({ error: "Missing hash" }, { status: 400 });
    }

    // Fetch bill and join with merchant_apps and merchant_users for merchant details
    const { data: bill, error } = await supabase
        .from('projects_bills')
        .select(`
            *,
            merchant:merchant_apps(
                name, 
                category,
                escrow_contract,
                user:merchant_users(wallet_address)
            )
        `)
        .eq('hash', hash)
        .single();

    if (error || !bill) {
        console.error("Bill lookup error:", error);
        return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(bill);
}
