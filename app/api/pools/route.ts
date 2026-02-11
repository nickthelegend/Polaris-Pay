
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

        // 1. Try to Update first
        const { data: existing, error: fetchError } = await supabase
            .from('pools')
            .select('id')
            .eq('name', name)
            .single();

        let result;
        const poolData = {
            name,
            tvl: tvl !== undefined ? Number(tvl) : undefined,
            apr: apr !== undefined ? Number(apr) : undefined,
            physical_balance: physical_balance !== undefined ? Number(physical_balance) : undefined,
            lp_balance: lp_balance !== undefined ? Number(lp_balance) : undefined,
            available_liquidity: available_liquidity !== undefined ? Number(available_liquidity) : undefined,
            updated_at: new Date().toISOString()
        };

        if (existing) {
            // Update existing
            result = await supabase
                .from('pools')
                .update(poolData)
                .eq('id', existing.id);
        } else {
            // Insert new
            result = await supabase
                .from('pools')
                .insert(poolData);
        }

        if (result.error) throw result.error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("[Pools API Error]:", e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
