
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
    const { data, error } = await supabase
        .from('pools')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ pools: data })
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, tvl, apr, physical_balance, lp_balance, available_liquidity } = body;

        if (!name) return NextResponse.json({ error: "Missing pool name" }, { status: 400 });

        const { error } = await supabase
            .from('pools')
            .upsert({
                name,
                tvl: tvl ? Number(tvl) : undefined,
                apr: apr ? Number(apr) : undefined,
                physical_balance: physical_balance ? Number(physical_balance) : undefined,
                lp_balance: lp_balance ? Number(lp_balance) : undefined,
                available_liquidity: available_liquidity ? Number(available_liquidity) : undefined,
                updated_at: new Date().toISOString()
            }, { onConflict: 'name' });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
