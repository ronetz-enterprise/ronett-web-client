import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/shared/utils/cn";

/**
 * Moment de réussite sobre (première vente, site créé, versement effectué) : coche qui apparaît,
 * message, prochaine étape. Surface `bg-primary/5`, animation coupée en mouvement réduit.
 */
export function SuccessMoment({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      role="status"
      className={cn(
        "flex flex-col items-start gap-4 rounded-xl border bg-primary/5 p-5 sm:flex-row sm:items-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:fade-in motion-safe:duration-300"
      >
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          strokeWidth={1.75}
          className="size-5"
        />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-heading text-base font-semibold">{title}</p>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </section>
  );
}
