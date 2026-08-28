import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useMarkets } from "@/hooks/useMarkets";
import { formatFiat } from "@/lib/format";

export const Route = createFileRoute("/trade")({ component: Trade });

function Trade() {
  const { markets, isLoading, error } = useMarkets();

  return <main className="mx-auto max-w-lg px-4 pb-24 pt-5">
    <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={17} /> Dashboard</Link>
    <div className="mt-5 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><TrendingUp size={22} /></span><div><h1 className="text-2xl font-semibold">Trade</h1><p className="text-sm text-muted-foreground">Select a listed coin to open its trading screen.</p></div></div>
    <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
      {isLoading ? <p className="p-5 text-sm text-muted-foreground">Loading listed coins…</p> : error ? <p className="p-5 text-sm text-destructive">{(error as Error).message}</p> : markets.map((market) => <Link key={market.id} to="/asset/$assetId" params={{ assetId: market.id }} className="flex items-center gap-3 border-b border-border p-4 last:border-b-0 hover:bg-secondary">
        <img src={market.image} alt="" className="size-10 rounded-full" />
        <span className="min-w-0 flex-1"><b className="block truncate">{market.name}</b><span className="text-xs uppercase text-muted-foreground">{market.symbol}/USD</span></span>
        <span className="text-right"><b className="block">{formatFiat(market.price)}</b><span className={`text-xs ${market.changePercent24h >= 0 ? "text-success" : "text-destructive"}`}>{market.changePercent24h >= 0 ? "+" : ""}{market.changePercent24h.toFixed(2)}%</span></span>
        <ChevronRight size={18} className="text-muted-foreground" />
      </Link>)}
    </section>
  </main>;
}
