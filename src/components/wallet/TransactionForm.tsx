import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMarkets } from "@/hooks/useMarkets";
import { useCreateTransaction } from "@/hooks/useWalletData";
import { SUPPORTED_ASSETS } from "@/data/assets";
import type { TransactionType } from "@/types/wallet";

export function TransactionForm({ type }: { type: TransactionType }) {
  const { markets } = useMarkets();
  const create = useCreateTransaction();
  const [assetId, setAssetId] = useState(SUPPORTED_ASSETS[0]?.id ?? "bitcoin");
  const [amount, setAmount] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [network, setNetwork] = useState("Bitcoin");
  const [reference, setReference] = useState<string | null>(null);
  const market = markets.find((m) => m.id === assetId);
  const fiatValue = Number(amount || 0) * (market?.price ?? 0);
  const label = type[0]!.toUpperCase() + type.slice(1);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!market || Number(amount) <= 0) return;
    const ref = await create.mutateAsync({
      type, asset_id: market.id, symbol: market.symbol, amount: Number(amount), fiat_value: fiatValue,
      counterparty: counterparty || undefined, network,
    });
    setReference(ref);
  }

  if (reference) return <main className="mx-auto max-w-lg px-4 pt-10"><div className="rounded-2xl border border-border bg-card p-7 text-center"><CheckCircle2 className="mx-auto text-primary" size={48}/><h1 className="mt-4 text-2xl font-semibold">Request created</h1><p className="mt-2 text-sm text-muted-foreground">Reference: <b>{reference}</b></p><p className="mt-3 text-xs text-muted-foreground">Recorded as pending. No blockchain transaction was broadcast.</p><Link to="/" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Back to dashboard</Link></div></main>;

  return <main className="mx-auto max-w-lg px-4 pt-5 pb-24"><Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={17}/> Dashboard</Link><div className="mt-5 rounded-2xl border border-border bg-card p-5"><h1 className="text-2xl font-semibold">{label}</h1><p className="mt-1 text-sm text-muted-foreground">Create a {type} request using your SmartChain account.</p><form onSubmit={(e)=>void submit(e)} className="mt-6 space-y-4">
    <label className="block text-sm font-medium">Asset<select value={assetId} onChange={e=>setAssetId(e.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-3">{SUPPORTED_ASSETS.map(a=><option key={a.id} value={a.id}>{a.name} ({a.symbol})</option>)}</select></label>
    <label className="block text-sm font-medium">Amount<input required min="0" step="any" type="number" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-3" placeholder="0.00"/><span className="mt-1 block text-xs text-muted-foreground">Estimated value: ${fiatValue.toLocaleString(undefined,{maximumFractionDigits:2})}</span></label>
    {type !== "swap" && <label className="block text-sm font-medium">{type === "receive" ? "Receiving address" : "Destination address"}<input required value={counterparty} onChange={e=>setCounterparty(e.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-3" placeholder="Wallet address"/></label>}
    <label className="block text-sm font-medium">Network<select value={network} onChange={e=>setNetwork(e.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-3"><option>Bitcoin</option><option>Ethereum</option><option>BNB Smart Chain</option><option>Polygon</option></select></label>
    <button disabled={create.isPending || !market} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50">{create.isPending && <Loader2 className="animate-spin" size={17}/>}Confirm {label}</button>
    {create.error && <p className="text-sm text-destructive">{(create.error as Error).message}</p>}
  </form></div></main>;
}
