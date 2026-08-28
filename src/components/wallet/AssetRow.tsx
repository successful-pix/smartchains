import type { AssetPosition } from "@/types/wallet";
import { formatAmount, formatFiat } from "@/lib/format";
import { CryptoLogo } from "./CryptoLogo";
import { PriceChange } from "./PriceChange";

interface AssetRowProps {
  position: AssetPosition;
  showHolding?: boolean;
  onSelect?: (position: AssetPosition) => void;
}

export function AssetRow({ position, showHolding = true, onSelect }: AssetRowProps) {
  const { market, balance, fiatValue } = position;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(position)}
        aria-label={`${market.name} details`}
        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <CryptoLogo src={market.image} symbol={market.symbol} />

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{market.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {market.symbol} · {formatFiat(market.price)}
          </span>
        </span>

        <span className="text-right">
          {showHolding ? (
            <>
              <span className="block text-sm font-medium tabular-nums">
                {formatAmount(balance, market.symbol)}
              </span>
              <span className="block text-xs tabular-nums text-muted-foreground">
                {formatFiat(fiatValue)}
              </span>
            </>
          ) : (
            <span className="block text-sm font-medium tabular-nums">
              {formatFiat(market.price)}
            </span>
          )}
          <PriceChange value={market.changePercent24h} className="block text-xs" />
        </span>
      </button>
    </li>
  );
}
