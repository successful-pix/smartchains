import { formatFiat } from "@/lib/format";

interface PriceDisplayProps {
  value: number;
  className?: string;
  currency?: string;
}

export function PriceDisplay({ value, className = "", currency = "USD" }: PriceDisplayProps) {
  return <span className={`tabular-nums ${className}`}>{formatFiat(value, currency)}</span>;
}
