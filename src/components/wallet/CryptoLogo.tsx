interface CryptoLogoProps {
  src?: string;
  symbol: string;
  size?: number;
  className?: string;
}

export function CryptoLogo({ src, symbol, size = 36, className = "" }: CryptoLogoProps) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-[11px] font-semibold text-muted-foreground ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={`${symbol} logo`}
          width={size}
          height={size}
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        symbol.slice(0, 3)
      )}
    </span>
  );
}
