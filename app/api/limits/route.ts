
import { NextResponse } from "next/server"
import { getUserVerifications } from "@/lib/verification-store"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request) {
  // In production, get wallet address from authenticated session
  const walletAddress = req.headers.get("x-wallet-address") || "mock-wallet-address"
  const userData = getUserVerifications(walletAddress)

  // Fetch base limits from DB
  const { data: limitData, error } = await supabase
    .from('limits')
    .select('*')
    .single() // Assuming single system limit row for now

  if (error && error.code !== 'PGRST116') { // Ignore no rows error for now, use fallback
    console.error("DB Error", error)
  }

  const baseLimit = limitData?.current_limit ?? 250.0
  const used = limitData?.used ?? 48.5

  const additionalLimit = userData.limitIncrease

  return NextResponse.json({
    currentLimit: Number(baseLimit) + additionalLimit,
    used: Number(used),
    available: (Number(baseLimit) + additionalLimit) - Number(used),
    creditScore: 612 + userData.verifiedProviders.size * 10,
    lastUpdated: new Date().toISOString(),
    verifications: {
      totalAlgoEarned: userData.totalAlgoEarned,
      verifiedProviders: Array.from(userData.verifiedProviders),
      limitIncrease: userData.limitIncrease,
    },
  })
}
