import { NextResponse } from "next/server"
import { getUserVerifications } from "@/lib/verification-store"

export async function GET(req: Request) {
  // In production, get wallet address from authenticated session
  // For now, using a mock wallet address
  const walletAddress = req.headers.get("x-wallet-address") || "mock-wallet-address"

  const userData = getUserVerifications(walletAddress)

  // Base limit
  const baseLimit = 250.0
  const additionalLimit = userData.limitIncrease

  // Mock data; in real app, compute from backend/chain
  return NextResponse.json({
    currentLimit: baseLimit + additionalLimit,
    used: 48.5,
    available: baseLimit + additionalLimit - 48.5,
    creditScore: 612 + userData.verifiedProviders.size * 10, // Increase score with verifications
    lastUpdated: new Date().toISOString(),
    verifications: {
      totalAlgoEarned: userData.totalAlgoEarned,
      verifiedProviders: Array.from(userData.verifiedProviders),
      limitIncrease: userData.limitIncrease,
    },
  })
}
