import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTransactionRequest,
  getHoldings,
  getNotifications,
  getPreferences,
  getProfile,
  getTransactions,
  markAllNotificationsRead,
  markNotificationRead,
  type NewTransaction,
} from "@/services/walletService";
import { useMarkets } from "./useMarkets";
import { SUPPORTED_ASSETS } from "@/data/assets";
import type { AssetPosition, PortfolioSummary } from "@/types/wallet";

export function useHoldings() {
  return useQuery({ queryKey: ["holdings"], queryFn: getHoldings });
}

export function useTransactions(limit = 50) {
  return useQuery({ queryKey: ["transactions", limit], queryFn: () => getTransactions(limit) });
}

export function useNotifications() {
  const query = useQuery({ queryKey: ["notifications"], queryFn: getNotifications });
  const unread = (query.data ?? []).filter((n) => !n.read).length;
  return { ...query, notifications: query.data ?? [], unread };
}

export function useNotificationActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  return {
    markRead: useMutation({ mutationFn: markNotificationRead, onSuccess: invalidate }),
    markAllRead: useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate }),
  };
}

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: getProfile });
}

export function usePreferences() {
  return useQuery({ queryKey: ["preferences"], queryFn: getPreferences });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTransaction) => createTransactionRequest(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Live market data joined with the user's stored balances. */
export function usePortfolio() {
  const markets = useMarkets();
  const holdings = useHoldings();

  const balanceByAsset = new Map<string, number>();
  for (const h of holdings.data ?? []) balanceByAsset.set(h.asset_id, h.balance);

  const order = new Map(SUPPORTED_ASSETS.map((a, i) => [a.id, i] as const));
  const positions: AssetPosition[] = markets.markets
    .map((market) => {
      const balance = balanceByAsset.get(market.id) ?? 0;
      return { market, balance, fiatValue: balance * market.price };
    })
    .sort((a, b) => {
      if (b.fiatValue !== a.fiatValue) return b.fiatValue - a.fiatValue;
      return (order.get(a.market.id) ?? 99) - (order.get(b.market.id) ?? 99);
    });

  const total = positions.reduce((sum, p) => sum + p.fiatValue, 0);
  const previousTotal = positions.reduce(
    (sum, p) => sum + p.fiatValue / (1 + p.market.changePercent24h / 100),
    0,
  );
  const changeValue = total - previousTotal;

  const portfolio: PortfolioSummary = {
    currency: "USD",
    availableBalance: total,
    changeValueToday: changeValue,
    changePercentToday: previousTotal > 0 ? (changeValue / previousTotal) * 100 : 0,
  };

  return {
    portfolio,
    positions,
    holdings,
    markets,
    // Market data is what determines whether the listed assets can render.
    // A missing/failed holdings table should not hide the 15 market assets.
    loading: markets.isLoading || holdings.isLoading,
    error: markets.error,
  };
}
