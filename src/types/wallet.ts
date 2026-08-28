/**
 * Core wallet domain types.
 * Market data comes from the market-data provider service; holdings and
 * transactions come from the user's own secured database rows.
 */

export type AssetSymbol = string;

/** Live market data for one coin. */
export interface MarketAsset {
  id: string;
  name: string;
  symbol: AssetSymbol;
  image: string;
  price: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
  sparkline: number[];
}

/** A coin row combining live market data with the user's own balance. */
export interface AssetPosition {
  market: MarketAsset;
  balance: number;
  fiatValue: number;
}

export type TransactionType = "deposit" | "withdraw" | "send" | "receive" | "swap";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  asset_id: string;
  symbol: AssetSymbol;
  amount: number;
  fiat_value: number;
  status: TransactionStatus;
  is_onchain: boolean;
  reference: string;
  counterparty: string | null;
  network: string | null;
  note: string | null;
  created_at: string;
}

export interface WalletHolding {
  id: string;
  asset_id: string;
  symbol: AssetSymbol;
  balance: number;
}

export interface PortfolioSummary {
  currency: string;
  availableBalance: number;
  changePercentToday: number;
  changeValueToday: number;
}

export interface AppNotification {
  id: string;
  category: "security" | "account" | "transaction";
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  currency: string;
  hide_balance: boolean;
  notify_security: boolean;
  notify_transactions: boolean;
  notify_marketing: boolean;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}
