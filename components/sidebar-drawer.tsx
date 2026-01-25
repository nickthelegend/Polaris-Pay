"use client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import useSWR from "swr"
import { MenuIcon } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function SidebarDrawer({ open, onOpenChange }: { open?: boolean; onOpenChange?: (v: boolean) => void }) {
  const { data } = useSWR("/api/referrals", fetcher)

  const referralLink = data?.link ?? "https://payease.app/r/ABC123"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="rounded-full bg-card/40 border border-border/40 p-2" aria-label="Open menu">
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[86vw] sm:w-96 bg-background/70 backdrop-blur-xl border-border/50">
        <SheetHeader>
          <SheetTitle>PayEase</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl p-4 border border-primary/20 bg-primary/10">
            <h3 className="font-semibold">Refer & Earn</h3>
            <p className="text-sm text-foreground/80 mt-1">
              Share your link and earn cashback on your friends’ first PayEase checkout.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="text-xs bg-card/60 px-2 py-1 rounded">{referralLink}</code>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => {
                  navigator.clipboard.writeText(referralLink)
                }}
              >
                Copy
              </Button>
            </div>
          </div>

          <nav className="grid gap-2">
            {[
              { href: "/piggy", label: "Piggy Bank" },
              { href: "/limits", label: "Increase Limit" },
              { href: "/docs", label: "Documentation" },
              { href: "/transactions", label: "Transactions" },
              { href: "/settings", label: "Settings" },
            ].map((i) => (
              <Link key={i.href} href={i.href} className="rounded-xl px-3 py-2 bg-card/40 border border-border/40">
                {i.label}
              </Link>
            ))}
          </nav>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">Your Bills</h4>
            <p className="text-sm text-foreground/80">Mocked purchases shown here.</p>
            <ul className="space-y-2 text-sm">
              <li className="rounded-xl px-3 py-2 bg-card/40 border border-border/40">
                Streaming — 9.99 USDC — due 11/02
              </li>
              <li className="rounded-xl px-3 py-2 bg-card/40 border border-border/40">
                Phone — 14.50 USDC — due 10/30
              </li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
