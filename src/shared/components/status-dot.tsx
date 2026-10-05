import type { StatusTone } from "./status";
import { cn } from "@/shared/utils/cn";

const dot: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground/50",
  pending: "bg-muted-foreground/50",
  info: "bg-info-foreground",
  success: "bg-success-foreground",
  warning: "bg-warning-foreground",
  danger: "bg-danger-foreground",
};

/**
 * Point de statut + libellé, plus léger qu'un badge dans un tableau. `live` ajoute un halo
 * discret (« en ligne », « en cours »), coupé quand l'utilisateur réduit les animations.
 */
export function StatusDot({
  label,
  tone = "neutral",
  live = false,
  className,
}: {
  label: string;
  tone?: StatusTone;
  live?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <span aria-hidden="true" className="relative flex size-2">
        {live && (
          <span
            className={cn(
              "absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping",
              dot[tone],
            )}
          />
        )}
        <span
          className={cn("relative inline-flex size-2 rounded-full", dot[tone])}
        />
      </span>
      {label}
    </span>
  );
}
