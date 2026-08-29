/** Supported display assets. marketId is the CoinGecko asset used for live price data. */
export interface SupportedAsset { id: string; marketId?: string; name: string; symbol: string; color: string; }
export const SUPPORTED_ASSETS: SupportedAsset[] = [
  { id:"bitcoin", name:"Bitcoin", symbol:"BTC", color:"#F7931A" },
  { id:"ethereum", name:"Ethereum", symbol:"ETH", color:"#627EEA" },
  { id:"tether", name:"Tether", symbol:"USDT", color:"#26A17B" },
  { id:"tether-trc20", marketId:"tether", name:"Tether USD (TRC-20)", symbol:"USDT-TRC20", color:"#26A17B" },
  { id:"binancecoin", name:"BNB", symbol:"BNB", color:"#F0B90B" }, { id:"solana", name:"Solana", symbol:"SOL", color:"#14F195" }, { id:"ripple", name:"XRP", symbol:"XRP", color:"#23292F" }, { id:"usd-coin", name:"USD Coin", symbol:"USDC", color:"#2775CA" }, { id:"cardano", name:"Cardano", symbol:"ADA", color:"#0033AD" }, { id:"dogecoin", name:"Dogecoin", symbol:"DOGE", color:"#C2A633" }, { id:"tron", name:"TRON", symbol:"TRX", color:"#EF0027" }, { id:"avalanche-2", name:"Avalanche", symbol:"AVAX", color:"#E84142" }, { id:"chainlink", name:"Chainlink", symbol:"LINK", color:"#2A5ADA" }, { id:"polygon-ecosystem-token", name:"Polygon", symbol:"POL", color:"#8247E5" }, { id:"litecoin", name:"Litecoin", symbol:"LTC", color:"#BFBBBB" }, { id:"polkadot", name:"Polkadot", symbol:"DOT", color:"#E6007A" }
];
export const SUPPORTED_ASSET_IDS = [...new Set(SUPPORTED_ASSETS.map(a=>a.marketId??a.id))];
export function findAsset(id:string):SupportedAsset|undefined{return SUPPORTED_ASSETS.find(a=>a.id===id)}
