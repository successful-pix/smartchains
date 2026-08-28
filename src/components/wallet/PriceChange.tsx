import { TrendingDown, TrendingUp } from "lucide-react";
import { formatPercent } from "@/lib/format";

interface PriceChangeProps {
  value: number;
  withIcon?: boolean;
  className?: string;
}

export function PriceChange({ value, withIcon = false, className = "" }: PriceChangeProps) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 tabular-nums ${positive ? "text-success" : "text-destructive"} ${className}`}
    >
      {withIcon && <Icon size={13} aria-hidden />}
      {formatPercent(value)}
    </span>
  );
}
