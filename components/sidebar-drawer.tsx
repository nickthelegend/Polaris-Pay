"use client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MenuIcon,
  LayoutDashboard,
  PiggyBank,
  Gauge,
  FileText,
  History,
  Settings,
  LogOut,
  User
} from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/pools", label: "PIGGY BANK", icon: PiggyBank },
  { href: "/limits", label: "LIMITS", icon: Gauge },
  { href: "/docs", label: "DOCS", icon: FileText },
  { href: "/transactions", label: "TRANSACTIONS", icon: History },
  { href: "/settings", label: "SETTINGS", icon: Settings },
]

export function SidebarDrawer({ open, onOpenChange }: { open?: boolean; onOpenChange?: (v: boolean) => void }) {
  const pathname = usePathname()
  const { user, authenticated, logout } = usePrivy()

  const shortAddress = (a: string) => a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="sm:hidden rounded-full bg-card/40 border border-border/40 p-2" aria-label="Open menu">
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-[#070B12] border-r border-white/5 flex flex-col font-mono uppercase">
        <SheetHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <div className="size-6 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor"></path>
              </svg>
            </div>
            <SheetTitle className="text-white text-lg font-black tracking-tighter uppercase">Polaris</SheetTitle>
          </div>
        </SheetHeader>

        <nav className="flex-1 mt-6 px-0 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange?.(false)}
                className={cn(
                  "relative flex items-center gap-3 px-6 py-4 text-[11px] font-bold tracking-widest transition-all group",
                  isActive
                    ? "bg-primary/5 text-primary border-r-2 border-primary"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("size-4", isActive ? "text-primary" : "text-white/40 group-hover:text-white")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="size-1.5 bg-primary rounded-full neon-glow animate-pulse"></span>
              <span className="text-[9px] font-bold text-white/40 tracking-widest">MAINNET ONLINE</span>
            </div>
            <span className="text-[9px] font-bold text-primary/60">24ms</span>
          </div>

          {authenticated && user?.wallet && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User className="size-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white tracking-tight">{shortAddress(user.wallet.address)}</span>
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">VERIFIED USER</span>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="text-white/20 hover:text-red-400 transition-colors"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
