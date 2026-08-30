import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowDownToLine, Send, Loader2, ShoppingCart, BadgeDollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMarkets, useMarketChart } from "@/hooks/useMarkets";
import { formatFiat } from "@/lib/format";
import { TradingChart } from "@/components/wallet/TradingChart";

export const Route = createFileRoute("/asset/$assetId")({ component: AssetDetails });
const pair = (s: string) => `${s.toUpperCase()}/USDT`;

type Holding = { asset_id: string; symbol: string; balance: number };

function AssetDetails() {
  const { assetId } = Route.useParams();
  const { markets, isLoading } = useMarkets();
  const [days, setDays] = useState(7);
  const { data: chart = [], isLoading: chartLoading } = useMarketChart(assetId, days);
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const market = markets.find((a) => a.id === assetId);

  async function loadHoldings() {
    const { data, error } = await supabase.from("wallet_holdings").select("asset_id,symbol,balance");
    if (!error) setHoldings((data ?? []).map((x: any) => ({ ...x, balance: Number(x.balance) })));
  }
  useEffect(() => { void loadHoldings(); }, [assetId]);

  if (isLoading) return <main className="mx-auto max-w-3xl p-5">Loading asset…</main>;
  if (!market) return <main className="mx-auto max-w-3xl p-5">Asset not found.</main>;

  const amountValue = Number(amount || 0);
  const usdtBalance = holdings.filter((h) => h.symbol === "USDT").reduce((n, h) => n + h.balance, 0);
  const assetBalance = holdings.filter((h) => h.asset_id === market.id).reduce((n, h) => n + h.balance, 0);
  const quantity = action === "buy" ? (market.price > 0 ? amountValue / market.price : 0) : amountValue;
  const totalUsdt = action === "buy" ? amountValue : quantity * market.price;
  const available = action === "buy" ? usdtBalance : assetBalance;

  function setPortion(percent: number) {
    setAmount(String(Math.max(0, available * percent / 100)));
  }

  async function placeOrder() {
    if (!Number.isFinite(quantity) || quantity <= 0) return toast.error("Enter a valid amount");
    if (market.price <= 0) return toast.error("Current market price is unavailable. Please wait a moment.");
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("execute_spot_trade", {
        p_asset_id: market.id,
        p_symbol: market.symbol,
        p_side: action,
        p_quantity: quantity,
        p_price: market.price,
      });
      if (error) throw error;
      await loadHoldings();
      setAmount("");
      toast.success(`${action === "buy" ? "Purchase" : "Sale"} completed`, {
        description: `${quantity.toFixed(8)} ${market.symbol} at ${formatFiat(market.price)} USDT`,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to complete market order");
    } finally {
      setSubmitting(false);
    }
  }

  const positive = market.changePercent24h >= 0;
  const inputLabel = action === "buy" ? "Amount in USDT" : `Amount of ${market.symbol} to sell`;
  const buttonLabel = `${action === "buy" ? "Buy" : "Sell"} ${pair(market.symbol)}`;

  return <main className="mx-auto max-w-3xl px-3 pb-28 pt-4">
    <Link to="/trade" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={17}/> Markets</Link>
    <section className="mt-4 rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold">{pair(market.symbol)}</h1><p className="text-xs text-muted-foreground">{market.name}</p></div><div className="text-right"><p className="text-xl font-semibold">{formatFiat(market.price)} USDT</p><p className={positive ? "text-xs text-success" : "text-xs text-destructive"}>{positive ? "+" : ""}{market.changePercent24h.toFixed(2)}%</p></div></div>
      <div className="mt-4 flex gap-2 overflow-x-auto rounded-xl bg-secondary p-1">{[[1,"1D"],[7,"1W"],[30,"1M"],[90,"3M"]].map(([d,l]) => <button key={String(l)} onClick={() => setDays(Number(d))} className={`rounded-lg px-4 py-2 text-xs ${days === d ? "bg-background font-semibold shadow-sm" : "text-muted-foreground"}`}>{l}</button>)}</div>
      <div className="mt-2">{chartLoading ? <div className="grid h-[300px] place-items-center rounded-2xl bg-secondary/40">Loading chart…</div> : <TradingChart points={chart} />}</div>
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1"><button onClick={() => { setAction("buy"); setAmount(""); }} className={`rounded-lg py-3 font-bold ${action === "buy" ? "bg-background text-success shadow-sm" : "text-muted-foreground"}`}>Buy</button><button onClick={() => { setAction("sell"); setAmount(""); }} className={`rounded-lg py-3 font-bold ${action === "sell" ? "bg-background text-destructive shadow-sm" : "text-muted-foreground"}`}>Sell</button></div>
      <div className="mt-4"><label className="text-xs font-medium">{inputLabel}<input type="number" min="0" step="any" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder={action === "buy" ? "Enter USDT amount" : `Enter ${market.symbol} amount`} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-3 text-sm"/></label>
      <p className="mt-2 text-xs text-muted-foreground">Available: {action === "buy" ? `${formatFiat(usdtBalance)} USDT` : `${assetBalance.toFixed(8)} ${market.symbol}`}</p>
      <div className="mt-3 grid grid-cols-4 gap-2">{[25,50,75,100].map(p => <button key={p} onClick={() => setPortion(p)} className="rounded-lg border py-2 text-xs">{p}%</button>)}</div>
      <div className="mt-3 rounded-xl bg-secondary p-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">{action === "buy" ? `You receive ${market.symbol}` : "You receive USDT"}</span><b>{action === "buy" ? (quantity ? quantity.toFixed(8) : "—") : (totalUsdt ? formatFiat(totalUsdt) : "—")}</b></div><div className="mt-1 flex justify-between"><span className="text-muted-foreground">Market price</span><b>{formatFiat(market.price)} USDT</b></div></div></div>
      <button disabled={submitting || amountValue <= 0} onClick={() => void placeOrder()} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-semibold text-primary-foreground disabled:opacity-50 ${action === "buy" ? "bg-primary" : "bg-destructive"}`}>{submitting ? <Loader2 className="animate-spin" size={18}/> : action === "buy" ? <ShoppingCart size={18}/> : <BadgeDollarSign size={18}/>} {submitting ? "Completing order…" : buttonLabel}</button>
      <p className="mt-3 text-center text-xs text-muted-foreground">Orders execute at the current displayed market price and update your wallet balance immediately.</p>
    </section>
    <div className="mt-4 grid grid-cols-2 gap-3"><Link to="/receive" className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold"><ArrowDownToLine size={17}/> Deposit</Link><Link to="/send" className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Send size={17}/> Send</Link></div>
  </main>;
}
