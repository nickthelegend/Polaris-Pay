import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const amount = Number(body?.amount ?? 0)
  const note = String(body?.note ?? "")
  const txId = `MOCK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  const explorerUrl = `https://allo.info/tx/${txId}?amount=${amount}&note=${encodeURIComponent(note)}`
  return NextResponse.json({ txId, explorerUrl })
}
