"use client"

import { ConnectGate } from "@/components/connect-gate"
import useSWR from "swr"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function TransactionsPage() {
  const { data } = useSWR("/api/transactions", fetcher)

  return (
    <ConnectGate>
      <div className="space-y-4">
        <section className="rounded-3xl p-4 bg-card/40 border border-border/40 backdrop-blur-xl">
          <h2 className="font-semibold">Recent Transactions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.transactions ?? []).map((t: any, i: number) => (
              <li
                key={i}
                className="rounded-xl px-3 py-2 bg-background/60 border border-border/40 flex justify-between"
              >
                <span>{t.title}</span>
                <span className="font-medium">
                  {t.amount} {t.asset}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl p-4 bg-card/40 border border-border/40 backdrop-blur-xl">
          <h2 className="font-semibold">Bills</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.bills ?? []).map((b: any, i: number) => (
              <li
                key={i}
                className="rounded-xl px-3 py-2 bg-background/60 border border-border/40 flex justify-between"
              >
                <span>{b.title}</span>
                <span className="font-medium">
                  {b.amount} {b.asset}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ConnectGate>
  )
}
