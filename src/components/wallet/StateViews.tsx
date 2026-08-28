import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading…", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-[10px] bg-secondary" />
      ))}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 size={15} className="animate-spin" aria-hidden />
      {label}
    </span>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[12px] border border-destructive/30 bg-destructive/5 px-5 py-6 text-center">
      <AlertTriangle size={20} className="text-destructive" aria-hidden />
      <p className="text-sm font-medium">Something went wrong</p>
      <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-[8px] border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">
        {icon}
      </span>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-[16rem] text-xs text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
