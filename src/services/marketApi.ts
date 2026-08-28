import type { MarketAsset } from "@/types/wallet";
import { SUPPORTED_ASSETS, SUPPORTED_ASSET_IDS } from "@/data/assets";

const BASE_URL = "https://api.coingecko.com/api/v3";
interface CoinGeckoMarket { id:string; symbol:string; name:string; image:string; current_price:number|null; price_change_percentage_24h:number|null; market_cap:number|null; total_volume:number|null; sparkline_in_7d?:{price:number[]}; }
export class MarketDataError extends Error {}
async function request<T>(path:string):Promise<T>{const res=await fetch(`${BASE_URL}${path}`,{headers:{accept:"application/json"}}).catch(()=>null);if(!res)throw new MarketDataError("Unable to reach the market data service.");if(res.status===429)throw new MarketDataError("Market data is rate limited. Retrying shortly.");if(!res.ok)throw new MarketDataError(`Market data unavailable (${res.status}).`);return (await res.json()) as T;}

function mergeMarkets(data:CoinGeckoMarket[]):MarketAsset[]{
 const live=new Map(data.map(c=>[c.id,c]));
 return SUPPORTED_ASSETS.map(a=>{const c=live.get(a.id);return {id:a.id,name:c?.name??a.name,symbol:(c?.symbol??a.symbol).toUpperCase(),image:c?.image??`https://assets.coingecko.com/coins/images/1/large/${a.id}.png`,price:c?.current_price??0,changePercent24h:c?.price_change_percentage_24h??0,marketCap:c?.market_cap??0,volume24h:c?.total_volume??0,sparkline:c?.sparkline_in_7d?.price??[]};});
}

export async function fetchMarkets(ids = SUPPORTED_ASSET_IDS):Promise<MarketAsset[]>{
 try{return mergeMarkets(await request<CoinGeckoMarket[]>(`/coins/markets?vs_currency=usd&ids=${ids.join(",")}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`));}
 catch(error){if(error instanceof MarketDataError)throw error;throw new MarketDataError("Market data unavailable.");}
}

export interface ChartPoint{t:number;price:number;}
export async function fetchMarketChart(id:string,days=7):Promise<ChartPoint[]>{const data=await request<{prices:[number,number][]}>(`/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}&interval=${days<=1?"hourly":"daily"}`);return data.prices.map(([t,price])=>({t,price}));}
