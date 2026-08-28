import { CandlestickChart, Home, LineChart, User, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavTab { id: string; label: string; icon: LucideIcon; href: string; }
const tabs: NavTab[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "markets", label: "Markets", icon: LineChart, href: "/markets" },
  { id: "trade", label: "Trade", icon: CandlestickChart, href: "/swap" },
  { id: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
  { id: "account", label: "Account", icon: User, href: "/account" },
];

export function BottomNavigation({ active = "home" }: { active?: string }) {
  return <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-secondary/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}><ul className="mx-auto grid max-w-lg grid-cols-5">
    {tabs.map(({ id, label, icon: Icon, href }) => { const isActive = id === active; return <li key={id}><a href={href} aria-current={isActive ? "page" : undefined} className={`flex w-full flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><Icon size={19} strokeWidth={isActive ? 2.4 : 1.8}/>{label}</a></li>; })}
  </ul></nav>;
}
