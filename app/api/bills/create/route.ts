import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(req: Request) {
    // API Authentication: Merchants use ClientID and ClientSecret
    const clientId = req.headers.get("x-client-id");
    const clientSecret = req.headers.get("x-client-secret");

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: "Missing Client Auth Headers (x-client-id, x-client-secret)" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { amount, description, metadata, asset = 'USDC' } = body;

    if (!amount) {
        return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    // 1. Verify Merchant App
    const { data: app, error: appError } = await supabase
        .from('merchant_apps')
        .select('id, name')
        .eq('client_id', clientId)
        .eq('client_secret', clientSecret)
        .single();

    if (appError || !app) {
        console.error("Auth failed for client:", clientId);
        return NextResponse.json({ error: "Invalid API Credentials" }, { status: 403 });
    }

    // 2. Generate unique secure bill hash
    // We use a cryptographically secure hex string as the bill identifier
    const billHash = crypto.randomBytes(20).toString('hex');

    // 3. Create the Bill record
    const { data: bill, error: billError } = await supabase
        .from('projects_bills')
        .insert({
            app_id: app.id,
            amount,
            asset,
            description,
            metadata: metadata || {},
            hash: billHash,
            status: 'pending'
        })
        .select()
        .single();

    if (billError) {
        console.error("Database error creating bill:", billError);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    // 4. Return integration data
    // The merchant can now redirect the user to this checkoutUrl
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.json({
        billId: bill.id,
        billHash: bill.hash,
        checkoutUrl: `${baseUrl}/pay/${bill.hash}`,
        merchantName: app.name,
        status: bill.status
    });
}
