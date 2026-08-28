import { History } from "lucide-react";
import type { WalletTransaction } from "@/types/wallet";
import { formatFiat } from "@/lib/format";

interface RecentActivityProps {
  transactions: WalletTransaction[];
  loading?: boolean;
}

export function RecentActivity({ transactions, loading = false }: RecentActivityProps) {
  return (
    <section aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="mb-2 px-1 font-display text-sm font-semibold">
        Recent Activity
      </h2>

      <div className="rounded-[12px] border border-border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-border" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">
              <History size={20} />
            </span>
            <p className="text-sm font-medium">No transactions yet</p>
            <p className="max-w-[15rem] text-xs text-muted-foreground">
              Once you deposit or send crypto, your activity will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm capitalize">
                  {tx.type} {tx.symbol}
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {formatFiat(tx.fiat_value)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
