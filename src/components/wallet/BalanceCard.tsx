import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { PortfolioSummary } from "@/types/wallet";
import { formatPercent } from "@/lib/format";
import { CurrencyPicker } from "./CurrencyPicker";
import { usePreferences } from "@/hooks/useWalletData";

interface BalanceCardProps { portfolio: PortfolioSummary; loading?: boolean; }

export function BalanceCard({ portfolio, loading = false }: BalanceCardProps) {
  const [hidden, setHidden] = useState(false);
  const prefs = usePreferences();
  const [currency, setCurrency] = useState(() => {
    if (typeof window === "undefined") return "USD";
    return localStorage.getItem("smartchain_display_currency") || "USD";
  });
  const [rate, setRate] = useState(1);
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    const saved = prefs.data?.currency;
    if (saved) {
      setCurrency(saved);
      localStorage.setItem("smartchain_display_currency", saved);
    }
  }, [prefs.data?.currency]);

  useEffect(() => {
    let cancelled = false;
    if (currency === "USD") { setRate(1); setRateLoading(false); return; }
    setRateLoading(true);
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("FX request failed")))
      .then((d: { rates?: Record<string, number> }) => {
        if (cancelled) return;
        const next = Number(d.rates?.[currency]);
        if (!Number.isFinite(next) || next <= 0) throw new Error("Currency rate unavailable");
        setRate(next);
      })
      .catch(() => { if (!cancelled) setRate(1); })
      .finally(() => { if (!cancelled) setRateLoading(false); });
    return () => { cancelled = true; };
  }, [currency]);

  const positive = portfolio.changePercentToday >= 0;
  const value = portfolio.availableBalance * rate;
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 1000 ? 2 : 8,
  }).format(value);

  function handleCurrencyChange(next: string) {
    setCurrency(next);
    localStorage.setItem("smartchain_display_currency", next);
  }

  return <section aria-label="Available balance" className="bank-card relative isolate overflow-hidden rounded-[12px] border border-border px-5 py-6 sm:px-6">
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16]" style={{ backgroundImage: "radial-gradient(circle at 88% 12%, var(--color-primary) 0%, transparent 42%), repeating-linear-gradient(115deg, transparent 0 22px, var(--color-primary) 22px 23px)" }} />
    <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 -z-10 size-40 rounded-full opacity-20 blur-2xl" style={{ background: "var(--gradient-gold)" }} />
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Available Balance</p>
        {loading ? <div className="mt-3 h-9 w-44 animate-pulse rounded-md bg-border" /> : <p className="mt-2 font-display text-[34px] font-semibold leading-none tracking-tight sm:text-[40px]">{hidden ? "••••••" : rateLoading ? "…" : formatted}</p>}
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => setHidden((v) => !v)} aria-label={hidden ? "Show balance" : "Hide balance"} className="rounded-md p-1 text-muted-foreground hover:text-primary">{hidden ? <EyeOff size={15} /> : <Eye size={15} />}</button>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${positive ? "border-success/25 bg-success/10 text-success" : "border-destructive/25 bg-destructive/10 text-destructive"}`}>{formatPercent(portfolio.changePercentToday)} Today</span>
        </div>
      </div>
      <CurrencyPicker value={currency} onChange={handleCurrencyChange} />
    </div>
    <div className="mt-7 flex justify-end"><span className="font-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">SmartChain</span></div>
  </section>;
}
