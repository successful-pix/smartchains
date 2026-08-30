import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMarkets } from "@/hooks/useMarkets";
import { useCreateTransaction } from "@/hooks/useWalletData";
import { SUPPORTED_ASSETS } from "@/data/assets";
import { supabase } from "@/integrations/supabase/client";
import type { TransactionType } from "@/types/wallet";

type AssetNetwork={asset_id:string;network:string;network_code:string;confirmations_required:number};
const assetLabel=(name:string,symbol:string)=>`${name} (${symbol})`;
const networkLabel=(symbol:string,network:string,code:string)=>{
 const n=`${network} ${code}`.toLowerCase();
 if(symbol.toUpperCase()==="USDT"&&(/trc|tron/.test(n)))return "USDT (TRC20)";
 if(symbol.toUpperCase()==="USDT"&&(/erc|ethereum/.test(n)))return "USDT (ERC20)";
 if(symbol.toUpperCase()==="ETH"&&(/erc|ethereum/.test(n)))return "ETH (ERC-20)";
 return `${network} (${code})`;
};
const gasFeeMessage=(symbol:string,network:string,code:string)=>{
 const n=`${network} ${code}`.toLowerCase();
 if(symbol.toUpperCase()==="USDT"&&(/trc|tron/.test(n))) return "Insufficient Tron balance to cover gas fee.";
 if(symbol.toUpperCase()==="USDT"&&(/erc|ethereum/.test(n))) return "Insufficient ETH balance to cover gas fee.";
 return "Insufficient ETH balance to cover gas fee.";
};
export function TransactionForm({ type }: { type: TransactionType }) {
 const { markets }=useMarkets();const create=useCreateTransaction();const [assetId,setAssetId]=useState(SUPPORTED_ASSETS[0]?.id??"bitcoin"),[amount,setAmount]=useState(""),[counterparty,setCounterparty]=useState(""),[networks,setNetworks]=useState<AssetNetwork[]>([]),[network,setNetwork]=useState(""),[reference,setReference]=useState<string|null>(null),[waiting,setWaiting]=useState(false),[gasError,setGasError]=useState<string|null>(null);const market=markets.find(m=>m.id===assetId);const fiatValue=Number(amount||0)*(market?.price??0);const label=type[0]!.toUpperCase()+type.slice(1);const assetNetworks=networks.filter(n=>n.asset_id===assetId);const selectedNetwork=assetNetworks.find(n=>n.network===network);
 useEffect(()=>{void(async()=>{const n=await supabase.from("asset_networks" as never).select("asset_id,network,network_code,confirmations_required").eq("enabled",true);setNetworks((n.data??[]) as AssetNetwork[])})()},[]);
 useEffect(()=>{const a=networks.filter(n=>n.asset_id===assetId);if(a.length&&!a.some(n=>n.network===network))setNetwork(a[0].network);},[assetId,networks]);
 async function submit(e:FormEvent){e.preventDefault();setGasError(null);if(!market||Number(amount)<=0||!network)return;if(type==="send"){setGasError(gasFeeMessage(market.symbol,selectedNetwork?.network??network,selectedNetwork?.network_code??""));return;}setWaiting(true);try{const ref=await create.mutateAsync({type,asset_id:market.id,symbol:market.symbol,amount:Number(amount),fiat_value:fiatValue,counterparty:counterparty||undefined,network});setReference(ref)}catch(error){setGasError(error instanceof Error?error.message:"Unable to submit request")}finally{setWaiting(false)}}
 if(reference)return <main className="mx-auto max-w-lg px-4 pt-10"><div className="rounded-2xl border bg-card p-7 text-center"><CheckCircle2 className="mx-auto text-primary" size={48}/><h1 className="mt-4 text-2xl font-semibold">Request created</h1><p className="mt-2 text-sm text-muted-foreground">Reference: <b>{reference}</b></p><Link to="/" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Back to dashboard</Link></div></main>;
 const displayError=type==="send"?gasError:(gasError||create.error?"Insufficient ETH balance to cover gas fee.":null);
 return <main className="mx-auto max-w-lg px-4 pb-24 pt-5"><Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={17}/> Dashboard</Link><div className="mt-5 rounded-2xl border bg-card p-5"><h1 className="text-2xl font-semibold">{label}</h1><p className="mt-1 text-sm text-muted-foreground">Select the exact asset and network before confirming.</p><form onSubmit={e=>void submit(e)} className="mt-6 space-y-4"><label className="block text-sm font-medium">Asset<select value={assetId} onChange={e=>setAssetId(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-3">{SUPPORTED_ASSETS.map(a=><option key={a.id} value={a.id}>{assetLabel(a.name,a.symbol)}</option>)}</select></label><label className="block text-sm font-medium">Amount<input required min="0" step="any" type="number" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-3" placeholder="0.00"/><span className="mt-1 block text-xs text-muted-foreground">Estimated value: ${fiatValue.toLocaleString(undefined,{maximumFractionDigits:2})}</span></label><label className="block text-sm font-medium">Destination address<input required value={counterparty} onChange={e=>setCounterparty(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-3" placeholder="Wallet address"/></label><label className="block text-sm font-medium">Network<select required value={network} onChange={e=>setNetwork(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-3"><option value="">Select network</option>{assetNetworks.map(n=><option key={n.network} value={n.network}>{networkLabel(market?.symbol??"",n.network,n.network_code)}</option>)}</select>{selectedNetwork&&<span className="mt-1 block text-xs text-muted-foreground">Estimated settlement requirement: {selectedNetwork.confirmations_required} network confirmation{selectedNetwork.confirmations_required===1?"":"s"}.</span>}</label>{displayError&&<div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive">{displayError}</div>}<button disabled={waiting||create.isPending||!market||!network} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50">{(waiting||create.isPending)&&<Loader2 className="animate-spin" size={17}/>}{waiting?"Processing…":`Confirm ${label}`}</button></form></div></main>;
}
