import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    transactions: [
      { title: "Groceries", amount: 24.0, asset: "USDC" },
      { title: "Subscription", amount: 12.99, asset: "USDC" },
      { title: "Network fee", amount: 0.25, asset: "ALGO" },
    ],
    bills: [
      { title: "Streaming — due 11/02", amount: 9.99, asset: "USDC" },
      { title: "Phone — due 10/30", amount: 14.5, asset: "USDC" },
    ],
  })
}
