"use client"

import { ConnectGate } from "@/components/connect-gate"
import useSWR from "swr"
import {
  ShoppingBag,
  Tv,
  Globe,
  Smartphone,
  FlashlightIcon as Bolt,
  Lightbulb,
  Info,
  ChevronRight,
  TrendingDown,
  ArrowUpRight
} from "lucide-react"
import Link from "next/link"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function TransactionsPage() {
  const { data } = useSWR("/api/transactions", fetcher)

  const transactions = data?.transactions ?? []
  const bills = data?.bills ?? []

  const monthlySpend = transactions
    .filter((t: any) => t.asset === "USDC")
    .reduce((acc: number, t: any) => acc + t.amount, 0)

  const upcomingBillsTotal = bills
    .filter((b: any) => b.asset === "USDC")
    .reduce((acc: number, b: any) => acc + b.amount, 0)

  return (
    <ConnectGate>
      <div className="flex flex-col gap-8 py-8 font-mono">
        {/* Top Summary Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-8 border-l-4 border-l-primary/40 relative overflow-hidden group">
            <p className="text-foreground/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Monthly Spend</p>
            <div className="flex items-baseline gap-2">
              <h1 className="text-white text-5xl font-black tracking-tighter tabular-nums">
                {monthlySpend.toFixed(2)}
              </h1>
              <span className="text-primary font-bold text-xs tracking-widest uppercase">USDC</span>
            </div>
            <TrendingDown className="absolute -bottom-2 -right-2 w-16 h-16 text-primary/5 group-hover:text-primary/10 transition-colors" />
          </div>

          <div className="glass-card rounded-2xl p-8 border-l-4 border-l-white/10 relative overflow-hidden group">
            <p className="text-foreground/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Total Upcoming Bills</p>
            <div className="flex items-baseline gap-2">
              <h1 className="text-white text-5xl font-black tracking-tighter tabular-nums">
                {upcomingBillsTotal.toFixed(2)}
              </h1>
              <span className="text-white/30 font-bold text-xs tracking-widest uppercase">USDC</span>
            </div>
            <ArrowUpRight className="absolute -bottom-2 -right-2 w-16 h-16 text-white/5 group-hover:text-white/10 transition-colors" />
          </div>

          <div className="lg:col-span-1 md:col-span-2">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-xs flex items-center gap-2 tracking-wider">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  TIPS & INSIGHTS
                </h3>
              </div>
              <p className="text-foreground/60 text-sm leading-relaxed">
                <strong className="text-white">Automatic Repayments:</strong> Your bills are settled automatically using your stablecoin balance to protect your health factor.
              </p>
            </div>
          </div>
        </section>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Recent Transactions List */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-white text-lg font-bold tracking-tight uppercase tracking-wider">Recent Transactions</h2>
              <Link href="#" className="text-primary text-[10px] font-black hover:underline uppercase tracking-widest transition-all">
                View All
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {transactions.map((t: any, i: number) => (
                <div
                  key={i}
                  className="glass-card rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.04] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-primary transition-colors">
                      {t.title.toLowerCase().includes("groceries") && <ShoppingBag className="w-5 h-5" />}
                      {t.title.toLowerCase().includes("subscription") && <Tv className="w-5 h-5" />}
                      {t.title.toLowerCase().includes("fee") && <Globe className="w-5 h-5" />}
                      {!["groceries", "subscription", "fee"].some(w => t.title.toLowerCase().includes(w)) && <Info className="w-5 h-5" />}
                    </div>
                    <span className="text-white font-bold tracking-tight">{t.title}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-black text-lg tabular-nums">{t.amount}</span>
                    <span className="text-white/30 text-[10px] font-bold ml-1 uppercase">{t.asset}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Bills List */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-white text-lg font-bold tracking-tight uppercase tracking-wider">Upcoming Bills</h2>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-primary/20 tracking-tighter">
                Action Required
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {bills.map((b: any, i: number) => (
                <div
                  key={i}
                  className={`glass-card rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.04] transition-all group cursor-pointer border-l-2 ${i === 0 ? 'border-l-primary shadow-[0_0_20px_rgba(var(--primary),0.05)]' : 'border-l-white/20'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                      {b.title.toLowerCase().includes("streaming") && <Bolt className="w-5 h-5" />}
                      {b.title.toLowerCase().includes("phone") && <Smartphone className="w-5 h-5" />}
                      {!["streaming", "phone"].some(w => b.title.toLowerCase().includes(w)) && <Info className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-white font-black block leading-tight tracking-tight">{b.title.split(" — ")[0]}</span>
                      <span className={`${i === 0 ? 'text-primary' : 'text-foreground/40'} text-[10px] font-bold uppercase tracking-widest`}>
                        {b.title.split(" — ")[1] || "Subscription"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-black text-lg tabular-nums">{b.amount}</span>
                    <span className="text-white/30 text-[10px] font-bold ml-1 uppercase">{b.asset}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ConnectGate>
  )
}
